import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, UserRound, RefreshCw, Eye, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../components/AppLayout";
import { PageHeader } from "../components/PageHeader";
import { yearRoman } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import * as studentService from "../services/studentService";
import * as performanceService from "../services/performanceService";
import type { Performance } from "../services/performanceService";

export default function SearchPage() {
  const navigate = useNavigate();
  const [roll, setRoll] = useState("");
  const [name, setName] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSearched(false);
    setPerformance(null);
    try {
      if (roll.trim()) {
        const student = await studentService.getStudentByRoll(roll.trim());
        setResults([student]);
      } else if (name.trim()) {
        const list = await studentService.searchStudents(name.trim());
        setResults(list);
      }
      setSearched(true);
    } catch (err: any) {
      setResults([]);
      setSearched(true);
      toast.error(err?.response?.data?.message ?? "No student found.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPerformance(studentId: string) {
    setSelectedId(studentId);
    setPerformance(null);
    try {
      const perf = await performanceService.getPerformance(studentId);
      setPerformance(perf);
    } catch (err: any) {
      if (err?.response?.status !== 404) toast.error("Could not load performance.");
      setPerformance(null);
    }
  }

  async function syncStudent(studentId: string) {
    setSyncing(true);
    try {
      const result = await performanceService.syncAll(studentId);
      result.results.forEach((r) => {
        if (r.success) toast.success(`${r.platform}: ${r.message}`);
        else toast.error(`${r.platform}: ${r.message}`);
      });
      await loadPerformance(studentId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <AppLayout>
      <PageHeader
        icon={<Search className="h-6 w-6" />}
        title="Search Student"
        description="Find a student by roll number or name and open their complete coding profile."
      />

      <Card className="mt-6">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="roll">Roll Number</Label>
              <Input id="roll" value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="e.g. 21CS001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya" />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading || (!roll.trim() && !name.trim())}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {searched && !loading && results.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed p-10 text-center">
          <p className="font-semibold">No student found</p>
          <p className="mt-1 text-sm text-muted-foreground">Check the roll number or try a different name.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-6 space-y-4">
          {results.map((s, idx) => (
            <Card key={s.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
                      {s.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.rollNumber} · {s.branch ?? "—"}
                        {s.year ? `, ${yearRoman(s.year)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={syncing}
                      onClick={() => syncStudent(s.id)}
                    >
                      {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Sync All
                    </Button>
                    <Button size="sm" onClick={() => navigate(`/students/${s.id}`)}>
                      <Eye className="h-4 w-4" />
                      Open Profile
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {selectedId === s.id && (
                  <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                    {performance ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <MiniStat label="Overall" value={performance.overallScore != null ? performance.overallScore.toFixed(2) : "—"} />
                        <MiniStat label="LeetCode" value={performance.leetcodeSolved != null ? `${performance.leetcodeSolved} solved` : "—"} />
                        <MiniStat label="Codeforces" value={performance.codeforcesRating != null ? String(performance.codeforcesRating) : "—"} />
                        <MiniStat label="CodeChef" value={performance.codechefRating != null ? String(performance.codechefRating) : "—"} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No performance data yet. Click Sync All to fetch live data.</p>
                    )}
                  </div>
                )}

                {results.length > 1 && idx === 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    <UserRound className="mr-1 inline h-3.5 w-3.5" />
                    {results.length} result{results.length > 1 ? "s" : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-bold tracking-tight">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
