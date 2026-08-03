import { useCallback, useEffect, useState } from "react";
import {
  Loader2, RefreshCw, FileDown, TrendingUp, Sparkles, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import type { Student } from "../services/studentService";
import * as performanceService from "../services/performanceService";
import type { Performance, PerformanceHistoryPoint, PlatformKey } from "../services/performanceService";
import * as insightService from "../services/insightService";
import type { InsightResponse } from "../services/insightService";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";

const PLATFORMS: { key: PlatformKey; label: string }[] = [
  { key: "LEETCODE", label: "LeetCode" },
  { key: "CODEFORCES", label: "Codeforces" },
  { key: "CODECHEF", label: "CodeChef" },
];

const SEVERITY_VARIANTS: Record<string, "success" | "warning" | "danger" | "secondary"> = {
  SUCCESS: "success",
  WARNING: "warning",
  CRITICAL: "danger",
  INFO: "secondary",
};

export default function StudentPerformancePanel({ student }: { student: Student }) {
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [history, setHistory] = useState<PerformanceHistoryPoint[]>([]);
  const [insights, setInsights] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<PlatformKey | "ALL" | null>(null);
  const [activePlatform, setActivePlatform] = useState<PlatformKey>("LEETCODE");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [historyData, insightsData] = await Promise.all([
        performanceService.getHistory(student.id),
        insightService.getInsights(student.id),
      ]);
      setHistory(historyData);
      setInsights(insightsData);
      try {
        const perf = await performanceService.getPerformance(student.id);
        setPerformance(perf);
      } catch (err: any) {
        if (err?.response?.status !== 404) throw err;
        setPerformance(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not load performance data.");
    } finally {
      setLoading(false);
    }
  }, [student.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSync(platform: PlatformKey | "ALL") {
    setSyncing(platform);
    try {
      if (platform === "ALL") {
        const result = await performanceService.syncAll(student.id);
        const failed = result.results.filter((r) => !r.success);
        result.results.forEach((r) => {
          if (r.success) toast.success(`${r.platform}: ${r.message}`);
          else toast.error(`${r.platform}: ${r.message}`);
        });
        if (failed.length === result.results.length) return;
      } else {
        const perf = await performanceService.syncPlatform(student.id, platform);
        setPerformance(perf);
        toast.success(`${platform} synced successfully`);
      }
      const [historyData, insightsData, perfData] = await Promise.all([
        performanceService.getHistory(student.id),
        insightService.getInsights(student.id),
        performanceService.getPerformance(student.id),
      ]);
      setHistory(historyData);
      setInsights(insightsData);
      setPerformance(perfData);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Sync failed.");
    } finally {
      setSyncing(null);
    }
  }

  const chartData = history
    .filter((h) => h.platform === activePlatform)
    .map((h) => ({
      capturedAt: new Date(h.capturedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      rating: h.rating,
      solved: h.problemsSolved,
    }));

  const scoreCards = [
    { label: "Overall Score", value: performance?.overallScore != null ? String(performance.overallScore) : "—" },
    { label: "Consistency", value: performance?.consistencyScore != null ? String(performance.consistencyScore) : "—" },
    { label: "LeetCode Solved", value: performance?.leetcodeSolved != null ? String(performance.leetcodeSolved) : "—" },
    {
      label: "Last Synced",
      value: performance?.lastUpdated ? new Date(performance.lastUpdated).toLocaleDateString() : "—",
    },
  ];

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance — {student.name}
            <span className="text-sm font-normal text-muted-foreground">({student.rollNumber})</span>
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Sync live data from coding platforms and track readiness over time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              performanceService.downloadReport(student.id);
              toast.success("PDF report downloaded");
            }}
          >
            <FileDown className="h-4 w-4" />
            PDF Report
          </Button>
        </div>
      </div>

      <Separator className="my-5" />

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading performance...
        </div>
      ) : error && !performance ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {scoreCards.map((c) => (
              <Card key={c.label}>
                <CardContent className="p-4">
                  <p className="text-xl font-bold tracking-tight">{c.value}</p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{c.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <PlatformCard title="LeetCode" main={`Rating: ${performance?.leetcodeRating ?? "—"}`}
              sub={`E/M/H: ${performance?.leetcodeEasy ?? 0}/${performance?.leetcodeMedium ?? 0}/${performance?.leetcodeHard ?? 0}`} />
            <PlatformCard title="Codeforces" main={`Rating: ${performance?.codeforcesRating ?? "—"}`} sub="Contest rating" />
            <PlatformCard title="CodeChef" main={`Rating: ${performance?.codechefRating ?? "—"}`} sub="Contest rating" />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Sync:</span>
            {PLATFORMS.map(({ key, label }) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => handleSync(key)}
                disabled={syncing !== null}
              >
                {syncing === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {label}
              </Button>
            ))}
            <Button size="sm" onClick={() => handleSync("ALL")} disabled={syncing !== null}>
              {syncing === "ALL" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync All
            </Button>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold">Rating Trend</p>
            <div className="mt-2 flex gap-1">
              {PLATFORMS.map(({ key, label }) => (
                <Button
                  key={key}
                  size="sm"
                  variant={activePlatform === key ? "default" : "outline"}
                  onClick={() => setActivePlatform(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
            {chartData.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No snapshots yet for {activePlatform}. Sync the platform to start building a trend.
              </p>
            ) : (
              <div className="mt-3 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.3} />
                    <XAxis dataKey="capturedAt" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="rating" stroke="#4f46e5" name="Rating" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="solved" stroke="#059669" name="Solved" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-6">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Coaching Insights
            </p>
            {insights && insights.insights.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {insights.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                    <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="flex-1">
                      <Badge variant={SEVERITY_VARIANTS[insight.severity] ?? "secondary"} className="mb-1">
                        {insight.severity}
                      </Badge>
                      <p>{insight.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No insights yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PlatformCard({ title, main, sub }: { title: string; main: string; sub: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-muted-foreground">{title}</p>
        <p className="mt-1 font-semibold">{main}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
