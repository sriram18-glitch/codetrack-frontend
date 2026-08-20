import { useEffect, useState } from "react";
import { FileText, Loader2, FileDown, GraduationCap, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../components/AppLayout";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import * as studentService from "../services/studentService";
import * as reportsService from "../services/reportsService";

export default function ReportsPage() {
  const [students, setStudents] = useState<{ id: string; name: string; rollNumber: string }[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSectionYear, setSelectedSectionYear] = useState("1");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    studentService
      .listStudents()
      .then((list) => {
        setStudents(list.map((s) => ({ id: s.id, name: s.name, rollNumber: s.rollNumber })));
        const branchSet = new Set<string>();
        list.forEach((s) => s.branch && branchSet.add(s.branch));
        setBranches(Array.from(branchSet).sort());
      })
      .catch(() => undefined);
  }, []);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    try {
      await fn();
      toast.success(`${label} downloaded`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? `Failed to generate ${label.toLowerCase()}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppLayout>
      <PageHeader
        icon={<FileText className="h-6 w-6" />}
        title="Reports"
        description="Generate printable PDF reports for students, branches, or the whole college."
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Student Report
            </CardTitle>
            <CardDescription>
              Detailed readiness report for a single student — platform stats, score, and consistency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Select a student..." />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.rollNumber} — {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              disabled={!selectedStudent || busy !== null}
              onClick={() =>
                run("Student report", async () => {
                  if (selectedStudent) await reportsService.downloadStudentReport(selectedStudent);
                })
              }
            >
              {busy === "Student report" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Download PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              Branch Report
            </CardTitle>
            <CardDescription>
              Performance snapshot for every student in a chosen branch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Select a branch..." />
              </SelectTrigger>
              <SelectContent>
                {branches.length === 0 && <SelectItem value="__none" disabled>No branches yet</SelectItem>}
                {branches.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              disabled={!selectedBranch || busy !== null}
              onClick={() =>
                run("Branch report", async () => {
                  if (selectedBranch) await reportsService.downloadBranchReport(selectedBranch);
                })
              }
            >
              {busy === "Branch report" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Download PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
          <CardHeader>
            <CardTitle className="text-white">College Summary</CardTitle>
            <CardDescription className="text-indigo-100">
              Whole-college overview: averages, readiness count, and ranked students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="secondary"
              className="w-full"
              disabled={busy !== null}
              onClick={() => run("College report", () => reportsService.downloadCollegeReport())}
            >
              {busy === "College report" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Download PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              Year-wise Report
            </CardTitle>
            <CardDescription>
              Consolidated performance report for a single academic year, ready for faculty review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select a year..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="1">I</SelectItem>
                <SelectItem value="2">II</SelectItem>
                <SelectItem value="3">III</SelectItem>
                <SelectItem value="4">IV</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={busy !== null}
                onClick={() => run("Year report", () => reportsService.downloadYearReport(selectedYear))}
              >
                {busy === "Year report" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                Generate Report
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={busy !== null}
                onClick={() => run("Year report", () => reportsService.downloadYearReport(selectedYear))}
              >
                <FileDown className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-amber-500" />
              Section-wise Report
            </CardTitle>
            <CardDescription>
              Performance table for a single academic year, ranked by section with section toppers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedSectionYear} onValueChange={setSelectedSectionYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select a year..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">I</SelectItem>
                <SelectItem value="2">II</SelectItem>
                <SelectItem value="3">III</SelectItem>
                <SelectItem value="4">IV</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              disabled={busy !== null}
              onClick={() => run("Section report", () => reportsService.downloadSectionReport(selectedSectionYear))}
            >
              {busy === "Section report" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Download PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
