import { useEffect, useMemo, useRef, useState } from "react";
import {
  Users, Plus, Loader2, Code2, Upload, Download, Search, MoreHorizontal, Pencil, Trash2, Activity, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { PageHeader, initialsAvatar } from "../components/PageHeader";
import StudentForm from "../components/StudentForm";
import StudentPerformancePanel from "../components/StudentPerformancePanel";
import CodingProfileDialog from "../components/CodingProfileDialog";
import * as studentService from "../services/studentService";
import type { Student } from "../services/studentService";
import * as analyticsService from "../services/analyticsService";
import * as csvService from "../services/csvService";
import * as performanceService from "../services/performanceService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import {
  Dialog, DialogContent,
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";

type SortKey = "roll" | "name" | "overall" | "recent";

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [atRiskIds, setAtRiskIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("roll");

  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [performanceStudent, setPerformanceStudent] = useState<Student | null>(null);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvImporting, setCsvImporting] = useState(false);

  async function loadStudents() {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.listStudents();
      setStudents(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not load students.");
    } finally {
      setLoading(false);
    }
  }

  async function loadScores() {
    try {
      const [leaderboard, atRisk] = await Promise.all([
        analyticsService.getLeaderboard(),
        analyticsService.getAtRisk(),
      ]);
      const scoreMap: Record<string, number | null> = {};
      for (const entry of leaderboard) scoreMap[entry.studentId] = entry.overallScore;
      setScores(scoreMap);
      setAtRiskIds(new Set(atRisk.map((s) => s.studentId)));
    } catch {
      // best-effort
    }
  }

  useEffect(() => {
    loadStudents();
    loadScores();
  }, []);

  async function refresh() {
    await Promise.all([loadStudents(), loadScores()]);
  }

  function openEditForm(student: Student) {
    setEditingStudent(student);
    setFormError(null);
    setShowForm(true);
  }

  async function handleStudentSubmit(payload: {
    rollNumber: string;
    name: string;
    email: string;
    branch?: string;
    year?: number;
    section?: string;
    phone?: string;
    leetcodeUsername?: string;
    codeforcesUsername?: string;
    codechefUsername?: string;
    sync?: boolean;
  }) {
    setFormError(null);
    setSubmitting(true);
    try {
      if (editingStudent) {
        await studentService.updateStudent(editingStudent.id, payload);
        toast.success("Student updated");
        if (payload.sync) {
          toast.info("Syncing platforms...");
          const result = await performanceService.syncAll(editingStudent.id);
          result.results.forEach((r) => {
            if (r.success) toast.success(`${r.platform}: ${r.message}`);
            else toast.error(`${r.platform}: ${r.message}`);
          });
        }
      } else {
        await studentService.createStudent(payload);
        toast.success("Student added");
      }
      setShowForm(false);
      setEditingStudent(null);
      await refresh();
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? "Could not save student.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await studentService.deleteStudent(deleteTarget.id);
      setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      if (performanceStudent?.id === deleteTarget.id) setPerformanceStudent(null);
      toast.success("Student deleted");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not delete student.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleCsvImport(file: File) {
    setCsvImporting(true);
    try {
      const result = await csvService.importCsv(file);
      toast.success(`CSV import: ${result.imported} imported, ${result.failed} failed`);
      if (result.errors.length) toast.info(result.errors.slice(0, 3).join(" "));
      await refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "CSV import failed.");
    } finally {
      setCsvImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const branches = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => s.branch && set.add(s.branch));
    return Array.from(set).sort();
  }, [students]);

  const years = useMemo(() => {
    const set = new Set<number>();
    students.forEach((s) => s.year && set.add(s.year));
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = students.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchQ = !q || [s.rollNumber, s.name, s.email, s.branch ?? ""].join(" ").toLowerCase().includes(q);
    const matchBranch = filterBranch === "all" || s.branch === filterBranch;
    const matchYear = filterYear === "all" || String(s.year) === filterYear;
    const score = scores[s.id];
    const status = score == null ? "unsynced" : atRiskIds.has(s.id) ? "at-risk" : "synced";
    const matchStatus = filterStatus === "all" || status === filterStatus;
    return matchQ && matchBranch && matchYear && matchStatus;
  });

  const sortedStudents = useMemo(() => {
    const list = [...filteredStudents];
    switch (sortKey) {
      case "name":
        list.sort(
          (a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) ||
            a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true, sensitivity: "base" })
        );
        break;
      case "overall":
        list.sort(
          (a, b) =>
            (scores[b.id] ?? -1) - (scores[a.id] ?? -1) ||
            a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true, sensitivity: "base" })
        );
        break;
      case "recent":
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        list.sort(
          (a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true, sensitivity: "base" })
        );
    }
    return list;
  }, [filteredStudents, sortKey, scores]);

  return (
    <AppLayout>
      <PageHeader
        icon={<Users className="h-6 w-6" />}
        title="Students"
        description="Manage student records, coding profiles, and performance data."
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roll/name/email..."
            className="w-64 pl-9"
          />
        </div>

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
              <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="synced">Synced</SelectItem>
            <SelectItem value="at-risk">At Risk</SelectItem>
            <SelectItem value="unsynced">Unsynced</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="roll">Roll Number</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="overall">Overall Score</SelectItem>
            <SelectItem value="recent">Recently Added</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => csvService.exportCsv()}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCsvImport(file);
            }}
          />
          <Button variant="outline" disabled={csvImporting} onClick={() => fileInputRef.current?.click()}>
            {csvImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import CSV
          </Button>
          <Button onClick={() => navigate("/students/add")}>
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && filteredStudents.length === 0 && (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="font-semibold">
              {search || filterBranch !== "all" || filterYear !== "all" || filterStatus !== "all"
                ? "No students match your filters"
                : "No students added yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || filterBranch !== "all" || filterYear !== "all" || filterStatus !== "all"
                ? "Try adjusting the search or filters."
                : 'Click "Add Student" above or import a CSV to get started.'}
            </p>
          </div>
        )}

        {!loading && !error && filteredStudents.length > 0 && (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Branch / Year</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStudents.map((s, idx) => {
                  const score = scores[s.id];
                  const status = score == null ? "unsynced" : atRiskIds.has(s.id) ? "at-risk" : "synced";
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.rollNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {initialsAvatar(s.name, idx)}
                          <span>{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.branch ?? "—"}
                        {s.year ? `, Year ${s.year}` : ""}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{s.email}</TableCell>
                      <TableCell>
                        <ScoreBadge score={score} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/students/${s.id}`)}>
                              <Eye className="h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPerformanceStudent(s)}>
                              <Activity className="h-4 w-4" />
                              Performance &amp; Sync
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setProfileStudent(s)}>
                              <Code2 className="h-4 w-4" />
                              Coding Profiles
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditForm(s)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(s)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <StudentForm
        open={showForm}
        editingStudent={editingStudent}
        submitting={submitting}
        error={formError}
        onSubmit={handleStudentSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingStudent(null);
        }}
      />

      <CodingProfileDialog
        open={!!profileStudent}
        student={profileStudent}
        onClose={() => setProfileStudent(null)}
      />

      <Dialog open={!!performanceStudent} onOpenChange={(o) => !o && setPerformanceStudent(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          {performanceStudent && <StudentPerformancePanel student={performanceStudent} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.name} ({deleteTarget?.rollNumber}) along with their coding
              profile and performance history.
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

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) {
    return <Badge variant="secondary">—</Badge>;
  }
  const variant = score >= 7 ? "success" : score >= 4 ? "warning" : "danger";
  return <Badge variant={variant as "success"}>{score.toFixed(2)}</Badge>;
}

function StatusBadge({ status }: { status: "synced" | "at-risk" | "unsynced" }) {
  if (status === "at-risk") return <Badge variant="danger">At Risk</Badge>;
  if (status === "synced") return <Badge variant="success">Synced</Badge>;
  return <Badge variant="secondary">Unsynced</Badge>;
}
