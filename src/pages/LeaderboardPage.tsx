import { useEffect, useMemo, useState } from "react";
import { Trophy, Medal } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { PageHeader, initialsAvatar } from "../components/PageHeader";
import { yearRoman } from "../lib/utils";
import * as analyticsService from "../services/analyticsService";
import type { LeaderboardEntry } from "../services/analyticsService";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";

const MEDAL_STYLES = ["text-amber-500", "text-slate-400", "text-orange-400"];

type SortKey = "overall" | "lc" | "cf" | "cc";

function byRoll(a: LeaderboardEntry, b: LeaderboardEntry) {
  return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true, sensitivity: "base" });
}

const SORTERS: Record<SortKey, (a: LeaderboardEntry, b: LeaderboardEntry) => number> = {
  overall: (a, b) =>
    (b.overallScore ?? -1) - (a.overallScore ?? -1) ||
    (b.totalSolved ?? 0) - (a.totalSolved ?? 0) ||
    byRoll(a, b),
  lc: (a, b) => (b.leetcodeSolved ?? -1) - (a.leetcodeSolved ?? -1),
  cf: (a, b) => (b.codeforcesRating ?? -1) - (a.codeforcesRating ?? -1),
  cc: (a, b) => (b.codechefRating ?? -1) - (a.codechefRating ?? -1),
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<SortKey>("overall");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterYear, setFilterYear] = useState("all");

  useEffect(() => {
    analyticsService
      .getLeaderboard()
      .then(setLeaderboard)
      .catch((err: any) => setError(err?.response?.data?.message ?? "Could not load leaderboard."))
      .finally(() => setLoading(false));
  }, []);

  const branches = useMemo(() => {
    const set = new Set<string>();
    leaderboard.forEach((e) => e.branch && set.add(e.branch));
    return Array.from(set).sort();
  }, [leaderboard]);

  const years = useMemo(() => {
    const set = new Set<number>();
    leaderboard.forEach((e) => e.year && set.add(e.year));
    return Array.from(set).sort();
  }, [leaderboard]);

  const filtered = useMemo(() => {
    return [...leaderboard]
      .filter((e) => filterBranch === "all" || e.branch === filterBranch)
      .filter((e) => filterYear === "all" || String(e.year) === filterYear)
      .sort(SORTERS[tab]);
  }, [leaderboard, filterBranch, filterYear, tab]);

  return (
    <AppLayout>
      <PageHeader
        icon={<Trophy className="h-6 w-6" />}
        title="Leaderboard"
        description="Overall Performance - ranked by Overall Score, with platform-specific views per tab."
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as SortKey)}>
          <TabsList>
            <TabsTrigger value="overall">Overall Performance</TabsTrigger>
            <TabsTrigger value="lc">LeetCode</TabsTrigger>
            <TabsTrigger value="cf">Codeforces</TabsTrigger>
            <TabsTrigger value="cc">CodeChef</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="ml-auto flex items-center gap-2">
          <Select value={filterBranch} onValueChange={setFilterBranch}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{yearRoman(y)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="mt-6 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">{error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed p-10 text-center">
          <p className="font-semibold">No ranked students</p>
          <p className="mt-1 text-sm text-muted-foreground">Sync a student's platforms to start ranking.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <Card className="mt-6 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Branch / Year</TableHead>
                <TableHead>{tab === "overall" ? "Overall Score" : tab === "lc" ? "Solved" : tab === "cf" ? "CF Rating" : "CC Rating"}</TableHead>
                <TableHead className="hidden sm:table-cell">Consistency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry, idx) => (
                <TableRow key={entry.studentId}>
                  <TableCell>
                    {idx < 3 ? (
                      <Medal className={`h-5 w-5 ${MEDAL_STYLES[idx]}`} />
                    ) : (
                      <span className="font-semibold text-muted-foreground">{idx + 1}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      {initialsAvatar(entry.name, idx)}
                      <div>
                        <p className="font-medium">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">{entry.rollNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {entry.branch ?? "—"}
                    {entry.year ? `, ${yearRoman(entry.year)}` : ""}
                  </TableCell>
                  <TableCell>
                    <ScoreBadge value={tab === "overall" ? entry.overallScore : tab === "lc" ? entry.leetcodeSolved : tab === "cf" ? entry.codeforcesRating : entry.codechefRating} metric={tab} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {entry.consistencyScore ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </AppLayout>
  );
}

function ScoreBadge({ value, metric }: { value: number | null; metric: SortKey }) {
  if (value == null) return <Badge variant="secondary">—</Badge>;
  if (metric === "overall") {
    const variant = value >= 7 ? "success" : value >= 4 ? "warning" : "danger";
    return <Badge variant={variant as "success"}>{value.toFixed(2)}</Badge>;
  }
  return <Badge variant="secondary">{value}</Badge>;
}
