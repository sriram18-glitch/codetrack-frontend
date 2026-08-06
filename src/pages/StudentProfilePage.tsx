import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Pencil, Trash2, RefreshCw, UserRound, Sparkles, Activity, BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../components/AppLayout";
import { PageHeader, initialsAvatar } from "../components/PageHeader";
import { yearRoman } from "../lib/utils";
import StudentForm from "../components/StudentForm";
import StudentPerformancePanel from "../components/StudentPerformancePanel";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import { Dialog, DialogContent } from "../components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";
import * as studentService from "../services/studentService";
import type { Student } from "../services/studentService";
import * as codingProfileService from "../services/codingProfileService";
import type { CodingProfile } from "../services/codingProfileService";
import * as performanceService from "../services/performanceService";
import type { Performance } from "../services/performanceService";
import * as insightService from "../services/insightService";
import type { InsightResponse } from "../services/insightService";

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [profile, setProfile] = useState<CodingProfile | null>(null);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [insights, setInsights] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSync, setShowSync] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [stu, perf, insightsData] = await Promise.all([
        studentService.getStudent(id),
        performanceService.getPerformance(id).catch((err: any) => (err?.response?.status === 404 ? null : Promise.reject(err))),
        insightService.getInsights(id).catch(() => null),
      ]);
      setStudent(stu);
      setPerformance(perf);
      setInsights(insightsData);
      try {
        const prof = await codingProfileService.getProfile(id);
        setProfile(prof);
      } catch {
        setProfile(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not load student profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleEdit(payload: {
    rollNumber: string;
    name: string;
    email: string;
    branch?: string;
    year?: number;
    section?: string;
    phone?: string;
  }) {
    if (!id) return;
    setFormError(null);
    setEditing(true);
    try {
      await studentService.updateStudent(id, payload);
      toast.success("Student updated");
      setShowEdit(false);
      await load();
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? "Could not update student.");
    } finally {
      setEditing(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await studentService.deleteStudent(id);
      toast.success("Student deleted");
      navigate("/students");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not delete student.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Skeleton className="h-48 lg:col-span-1" />
            <Skeleton className="h-64 lg:col-span-2" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !student) {
    return (
      <AppLayout>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-destructive">{error ?? "Student not found"}</div>
      </AppLayout>
    );
  }

  const readiness = performance?.overallScore != null ? Math.round(performance.overallScore * 10) : null;
  const breakdown = breakdownComponents(performance);

  const platformCards = [
    {
      title: "LeetCode",
      username: profile?.leetcodeUsername,
      metrics: performance ? [
        { label: "Rating", value: displayMetric(performance.leetcodeRating) },
        { label: "Problems Solved", value: displayMetric(performance.leetcodeSolved) },
        {
          label: "Easy / Medium / Hard",
          value: `${performance.leetcodeEasy ?? 0}/${performance.leetcodeMedium ?? 0}/${performance.leetcodeHard ?? 0}`,
        },
      ] : [],
    },
    {
      title: "Codeforces",
      username: profile?.codeforcesUsername,
      metrics: performance ? [
        { label: "Rating", value: displayMetric(performance.codeforcesRating) },
        { label: "Problems Solved", value: displayMetric(performance.codeforcesSolved) },
        { label: "Max Rating", value: displayMetric(performance.codeforcesMaxRating) },
        { label: "Rank", value: displayMetric(performance.codeforcesRank) },
        { label: "Contest Count", value: displayMetric(performance.codeforcesContestCount) },
      ] : [],
    },
    {
      title: "CodeChef",
      username: profile?.codechefUsername,
      metrics: performance ? [
        { label: "Rating", value: displayMetric(performance.codechefRating) },
        { label: "Problems Solved", value: displayMetric(performance.codechefSolved) },
        { label: "Stars", value: displayMetric(performance.codechefStars) },
        { label: "Global Rank", value: displayMetric(performance.codechefGlobalRank) },
      ] : [],
    },
  ];

  return (
    <AppLayout>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground" onClick={() => navigate("/students")}>
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          icon={<UserRound className="h-6 w-6" />}
          title={student.name}
          description={`${student.rollNumber}${student.branch ? ` · ${student.branch}` : ""}${student.year ? ` · ${yearRoman(student.year)}` : ""}`}
        />
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowSync(true)}>
            <RefreshCw className="h-4 w-4" />
            Sync Data
          </Button>
          <Button variant="outline" onClick={() => setShowEdit(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Personal details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                {initialsAvatar(student.name)}
                <div>
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.email}</p>
                </div>
              </div>
              <Separator />
              <DetailRow label="Roll Number" value={student.rollNumber} />
              <DetailRow label="Branch" value={student.branch ?? "—"} />
              <DetailRow label="Year" value={student.year ? yearRoman(student.year) : "—"} />
              <DetailRow label="Section" value={student.section ?? "—"} />
              <DetailRow label="Phone" value={student.phone ?? "—"} />
            </CardContent>
          </Card>

          {/* Overall performance */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {performance ? (
                <>
                  <div className="text-center">
                    <p className="text-4xl font-extrabold tracking-tight text-primary">{performance.overallScore}</p>
                    <p className="text-sm text-muted-foreground">Overall Score (0–10)</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-medium">
                        <BadgeCheck className="h-4 w-4 text-emerald-500" />
                        Placement Readiness
                      </span>
                      <span className="font-bold">{readiness}%</span>
                    </div>
                    <Progress value={readiness ?? 0} className="mt-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Consistency</span>
                    <span className="font-semibold">{performance.consistencyScore ?? "—"} / 10</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Synced</span>
                    <span className="font-semibold">
                      {performance.lastUpdated ? new Date(performance.lastUpdated).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No performance data yet. Click "Sync Data" to fetch live statistics.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Platform cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {platformCards.map((p) => (
              <Card key={p.title}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{p.title}</p>
                    {p.username ? <Badge variant="success">Connected</Badge> : <Badge variant="secondary">Not set</Badge>}
                  </div>
                  <p className="mt-3 font-semibold">{p.username ?? "No username"}</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {p.metrics.length ? p.metrics.map((m) => (
                      <li key={m.label} className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">{m.label}</span>
                        <span className={m.value === "Unavailable" ? "font-medium text-muted-foreground" : "font-medium"}>
                          {m.value}
                        </span>
                      </li>
                    )) : <li className="text-muted-foreground">No sync data</li>}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Score breakdown */}
          {performance && (
            <Card>
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {breakdown.map((b) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{b.label} <span className="text-xs text-muted-foreground">({b.weight}%)</span></span>
                      <span className="font-semibold">{b.value}</span>
                    </div>
                    <Progress value={b.percent} className="mt-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights && insights.insights.length > 0 ? (
                <ul className="space-y-2">
                  {insights.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                      <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="flex-1">
                        <Badge variant={SEVERITY[insight.severity] ?? "secondary"} className="mb-1">{insight.severity}</Badge>
                        <p>{insight.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">Sync data to generate coaching insights.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <StudentForm
        open={showEdit}
        editingStudent={student}
        submitting={editing}
        error={formError}
        onSubmit={handleEdit}
        onCancel={() => {
          setShowEdit(false);
          setFormError(null);
        }}
      />

      <Dialog open={showSync} onOpenChange={(o) => !o && setShowSync(false)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <StudentPerformancePanel student={student} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {student.name} ({student.rollNumber}) along with their coding profile and
              performance history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function breakdownComponents(performance: Performance | null) {
  if (!performance) return [];
  const s = performance.leetcodeSolved ?? 0;
  const cfSolved = performance.codeforcesSolved ?? 0;
  const ccSolved = performance.codechefSolved ?? 0;
  const weighted = (performance.leetcodeEasy ?? 0) + 2 * (performance.leetcodeMedium ?? 0) + 4 * (performance.leetcodeHard ?? 0);
  const lc = Math.min(6, (weighted / 600) * 6) + Math.min(4, ((performance.leetcodeRating ?? 0) / 3000) * 4);
  const cf = performance.codeforcesRating
    ? Math.min(10, (performance.codeforcesRating / 3500) * 10)
    : cfSolved
      ? Math.min(10, (cfSolved / 300) * 10)
      : 0;
  const cc = performance.codechefRating
    ? Math.min(10, (performance.codechefRating / 3500) * 10)
    : ccSolved
      ? Math.min(10, (ccSolved / 300) * 10)
      : 0;
  const ps = Math.min(10, ((s + cfSolved + ccSolved) / 300) * 10);
  const items = [
    { label: "LeetCode", weight: 35, value: Math.min(10, lc) },
    { label: "Codeforces", weight: 30, value: cf },
    { label: "CodeChef", weight: 15, value: cc },
    { label: "Consistency", weight: 10, value: performance.consistencyScore ?? 0 },
    { label: "Problem Solving", weight: 10, value: ps },
  ];
  return items.map((it) => ({
    ...it,
    percent: Math.round((Math.min(10, Math.max(0, it.value)) / 10) * 100),
    value: `${it.value.toFixed(2)} / 10`,
  }));
}

const SEVERITY: Record<string, "success" | "warning" | "danger" | "secondary"> = {
  SUCCESS: "success",
  WARNING: "warning",
  CRITICAL: "danger",
  INFO: "secondary",
};

function displayMetric(value: unknown): string {
  return value === null || value === undefined || value === "" ? "Unavailable" : String(value);
}