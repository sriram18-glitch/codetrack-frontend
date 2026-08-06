import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, UserPlus, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../components/AppLayout";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import * as studentService from "../services/studentService";
import * as performanceService from "../services/performanceService";

const PROFILE_FIELDS = [
  { key: "leetcode", label: "LeetCode Username", placeholder: "e.g. sriram_9167" },
  { key: "codeforces", label: "Codeforces Username", placeholder: "e.g. tourist" },
  { key: "codechef", label: "CodeChef Username", placeholder: "e.g. gennady.korotkevich" },
] as const;

type ProfileKey = (typeof PROFILE_FIELDS)[number]["key"];

export default function AddStudentPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState<"save" | "sync" | null>(null);

  // Personal
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Academic
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");

  // Coding profiles
  const [profiles, setProfiles] = useState<Record<ProfileKey, string>>({
    leetcode: "",
    codeforces: "",
    codechef: "",
  });

  async function createAndNavigate(sync: boolean) {
    try {
      const student = await studentService.createStudent({
        rollNumber,
        name,
        email,
        branch: branch || undefined,
        year: year ? Number(year) : undefined,
        section: section || undefined,
        phone: phone || undefined,
        leetcodeUsername: profiles.leetcode || undefined,
        codeforcesUsername: profiles.codeforces || undefined,
        codechefUsername: profiles.codechef || undefined,
      });

      if (sync) {
        toast.success("Student created — syncing platforms...");
        const result = await performanceService.syncAll(student.id);
        result.results.forEach((r) => {
          if (r.success) toast.success(`${r.platform}: ${r.message}`);
          else toast.error(`${r.platform}: ${r.message}`);
        });
      } else {
        toast.success("Student added successfully");
      }

      navigate(`/students/${student.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not create student.");
    } finally {
      setSaving(null);
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving("save");
    createAndNavigate(false);
  }

  function handleSaveAndSync(e: React.FormEvent) {
    e.preventDefault();
    setSaving("sync");
    createAndNavigate(true);
  }

  return (
    <AppLayout>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground" onClick={() => navigate("/students")}>
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </Button>

      <PageHeader
        icon={<UserPlus className="h-6 w-6" />}
        title="Add Student"
        description="Register a new student with academic details and coding platform handles."
      />

      <form onSubmit={handleSave} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Core identity details for the student record.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number *</Label>
              <Input id="rollNumber" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="e.g. 21CS001" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@college.edu" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
            <CardDescription>Branch, year, and section for grouping and analytics.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input id="branch" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="e.g. CSE" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input id="year" type="number" min={1} max={6} value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 3" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input id="section" value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. A" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Coding Profiles</CardTitle>
            <CardDescription>Handles used to fetch live statistics from each platform.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROFILE_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={profiles[key]}
                  onChange={(e) => setProfiles((v) => ({ ...v, [key]: e.target.value }))}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <Button type="submit" disabled={saving !== null}>
            {saving === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
          <Button type="button" variant="secondary" disabled={saving !== null} onClick={handleSaveAndSync}>
            {saving === "sync" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Save &amp; Sync
          </Button>
          <Button type="button" variant="outline" disabled={saving !== null} onClick={() => navigate("/students")}>
            Cancel
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
