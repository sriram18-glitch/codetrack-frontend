import { useEffect, useState } from "react";
import { BarChart3, Medal, Users, TrendingUp, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { PageHeader } from "../components/PageHeader";
import * as analyticsService from "../services/analyticsService";
import type { AnalyticsSummary, BranchAnalytics, LeaderboardEntry, AtRiskStudent } from "../services/analyticsService";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";

const COLORS = ["#4f46e5", "#059669", "#d97706", "#dc2626", "#0ea5e9", "#7c3aed"];
const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#94a3b8"];

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [branches, setBranches] = useState<BranchAnalytics[]>([]);
  const [topSolvers, setTopSolvers] = useState<LeaderboardEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      analyticsService.getSummary(),
      analyticsService.getByBranch(),
      analyticsService.getTopSolvers(),
      analyticsService.getLeaderboard(),
      analyticsService.getAtRisk(),
    ])
      .then(([s, b, t, l, r]) => {
        setSummary(s);
        setBranches(b);
        setTopSolvers(t);
        setLeaderboard(l);
        setAtRisk(r);
      })
      .catch((err: any) => setError(err?.response?.data?.message ?? "Could not load analytics."))
      .finally(() => setLoading(false));
  }, []);

  const branchChartData = branches.map((b) => ({ name: b.branch, score: Number(b.averageOverallScore) }));

  const platformData = [
    { name: "LeetCode", value: leaderboard.filter((e) => (e.leetcodeSolved ?? 0) > 0).length },
    { name: "Codeforces", value: leaderboard.filter((e) => (e.codeforcesRating ?? 0) > 0).length },
    { name: "CodeChef", value: leaderboard.filter((e) => (e.codechefRating ?? 0) > 0).length },
  ];

  const readinessData = [
    { name: "Ready (≥7)", value: leaderboard.filter((e) => (e.overallScore ?? 0) >= 7).length },
    { name: "Developing (4–7)", value: leaderboard.filter((e) => (e.overallScore ?? 0) >= 4 && (e.overallScore ?? 0) < 7).length },
    { name: "At Risk (<4)", value: leaderboard.filter((e) => (e.overallScore ?? 0) < 4).length },
    { name: "Unsynced", value: (summary?.totalStudents ?? 0) - (summary?.studentsWithPerformance ?? 0) },
  ];

  return (
    <AppLayout>
      <PageHeader
        icon={<BarChart3 className="h-6 w-6" />}
        title="Analytics"
        description="Readiness trends and breakdowns across your college."
      />

      {loading && (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">{error}</div>
      )}

      {!loading && !error && summary && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Metric icon={<Users className="h-5 w-5 text-primary" />} label="Tracked Students" value={String(summary.studentsWithPerformance)} />
            <Metric icon={<TrendingUp className="h-5 w-5 text-primary" />} label="Average Score" value={summary.averageOverallScore.toFixed(2)} />
            <Metric icon={<Medal className="h-5 w-5 text-primary" />} label="Top Performer" value={summary.topPerformer?.name ?? "—"} />
            <Metric icon={<BarChart3 className="h-5 w-5 text-primary" />} label="Avg Consistency" value={summary.averageConsistency.toFixed(2)} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="Average Score by Branch">
              {branchChartData.length === 0 ? (
                <Empty>No scored branches yet.</Empty>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="score" name="Avg score" radius={[6, 6, 0, 0]}>
                        {branchChartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard title="Platform Distribution">
              {platformData.every((d) => d.value === 0) ? (
                <Empty>Sync students to see platform activity.</Empty>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {platformData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard title="Placement Readiness Distribution">
              {readinessData.every((d) => d.value === 0) ? (
                <Empty>No data to distribute.</Empty>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={readinessData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {readinessData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard title="Top Problem Solvers (LeetCode)">
              {topSolvers.length === 0 ? (
                <Empty>No LeetCode data synced yet.</Empty>
              ) : (
                <ul className="mt-4 space-y-3">
                  {topSolvers.map((s, i) => (
                    <li key={s.studentId} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-sm font-bold text-muted-foreground">{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.rollNumber}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {s.leetcodeSolved} solved
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </ChartCard>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  At-Risk Students
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate("/search")}>
                  Take action
                </Button>
              </CardHeader>
              <CardContent>
                {atRisk.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No students currently at risk.</p>
                ) : (
                  <ul className="space-y-3">
                    {atRisk.map((s) => (
                      <li key={s.studentId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.rollNumber}</p>
                        </div>
                        <p className="text-xs text-destructive">{s.reason}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AppLayout>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <p className="mt-3 text-xl font-bold tracking-tight">{value}</p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}
