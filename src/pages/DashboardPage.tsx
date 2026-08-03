import { useEffect, useMemo, useState } from "react";
import {
  Users, TrendingUp, Award, AlertTriangle, BadgeCheck, UserPlus, Trophy, BarChart3, ListOrdered, LayoutDashboard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import AppLayout from "../components/AppLayout";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import * as analyticsService from "../services/analyticsService";
import type { AnalyticsSummary, BranchAnalytics, LeaderboardEntry } from "../services/analyticsService";

const PIE_COLORS = ["#6366f1", "#0ea5e9", "#f59e0b"];
const BAR_COLORS = ["#4f46e5", "#059669", "#d97706", "#dc2626", "#0ea5e9", "#7c3aed"];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [branches, setBranches] = useState<BranchAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsService.getSummary(),
      analyticsService.getLeaderboard(),
      analyticsService.getByBranch(),
    ])
      .then(([s, l, b]) => {
        setSummary(s);
        setLeaderboard(l);
        setBranches(b);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const placementReady = useMemo(
    () => leaderboard.filter((e) => (e.overallScore ?? 0) >= 7).length,
    [leaderboard]
  );

  const platformDistribution = useMemo(() => {
    const lc = leaderboard.filter((e) => (e.leetcodeSolved ?? 0) > 0).length;
    const cf = leaderboard.filter((e) => (e.codeforcesRating ?? 0) > 0).length;
    const cc = leaderboard.filter((e) => (e.codechefRating ?? 0) > 0).length;
    return [
      { name: "LeetCode", value: lc },
      { name: "Codeforces", value: cf },
      { name: "CodeChef", value: cc },
    ];
  }, [leaderboard]);

  const branchChart = branches.map((b) => ({ name: b.branch, score: Number(b.averageOverallScore) }));

  const statCards = [
    {
      icon: Users,
      label: "Total Students",
      value: summary ? String(summary.totalStudents) : "—",
      hint: "Registered in CodeTrack",
      gradient: "from-indigo-500 to-violet-500",
      glow: "shadow-indigo-500/30",
    },
    {
      icon: TrendingUp,
      label: "Average Overall Score",
      value: summary ? summary.averageOverallScore.toFixed(2) : "—",
      hint: "Readiness score (0–10)",
      gradient: "from-emerald-500 to-teal-500",
      glow: "shadow-emerald-500/30",
    },
    {
      icon: BadgeCheck,
      label: "Placement Ready",
      value: String(placementReady),
      hint: "Overall score ≥ 7",
      gradient: "from-sky-500 to-blue-500",
      glow: "shadow-sky-500/30",
    },
    {
      icon: AlertTriangle,
      label: "At Risk",
      value: summary ? String(summary.atRiskCount) : "—",
      hint: "Low score / inactive",
      gradient: "from-rose-500 to-pink-500",
      glow: "shadow-rose-500/30",
    },
    {
      icon: Award,
      label: "Top Performer",
      value: summary?.topPerformer?.name ?? "—",
      hint: summary?.topPerformer ? `Score ${summary.topPerformer.overallScore ?? "—"}/10` : "Sync data to reveal",
      gradient: "from-amber-500 to-orange-500",
      glow: "shadow-amber-500/30",
    },
  ];

  return (
    <AppLayout>
      <PageHeader
        icon={<LayoutDashboard className="h-6 w-6" />}
        title="Dashboard"
        description="Coding performance overview for your college."
      />

      {loading ? (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {statCards.map(({ icon: Icon, label, value, hint, gradient, glow }) => (
              <Card key={label} className="relative overflow-hidden">
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
                <CardContent className="p-5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg ${glow}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 truncate text-2xl font-extrabold tracking-tight">{value}</p>
                  <p className="mt-0.5 text-sm font-medium text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Platform Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {platformDistribution.every((d) => d.value === 0) ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Sync students to see platform activity.
                  </p>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={platformDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {platformDistribution.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Branch Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {branchChart.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">No scored branches yet.</p>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={branchChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.3} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="score" name="Avg score" radius={[6, 6, 0, 0]}>
                          {branchChart.map((_, i) => (
                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <QuickAction icon={<UserPlus className="h-5 w-5" />} label="Add Student" sub="Register a new student" gradient="from-indigo-500 to-violet-500" onClick={() => navigate("/students/add")} />
                <QuickAction icon={<ListOrdered className="h-5 w-5" />} label="Students" sub="Manage all students" gradient="from-emerald-500 to-teal-500" onClick={() => navigate("/students")} />
                <QuickAction icon={<Trophy className="h-5 w-5" />} label="Leaderboard" sub="View top performers" gradient="from-amber-500 to-orange-500" onClick={() => navigate("/leaderboard")} />
                <QuickAction icon={<BarChart3 className="h-5 w-5" />} label="Analytics" sub="Branch trends & insights" gradient="from-rose-500 to-pink-500" onClick={() => navigate("/analytics")} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AppLayout>
  );
}

function QuickAction({
  icon, label, sub, gradient, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      className="h-auto justify-start gap-3 p-4"
      onClick={onClick}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white`}>
        {icon}
      </div>
      <div className="text-left">
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </Button>
  );
}
