import { FormEvent, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import type { Student } from "../services/studentService";
import * as codingProfileService from "../services/codingProfileService";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

const PROFILE_FIELDS = [
  { key: "leetcode", label: "LeetCode Username", placeholder: "e.g. sriram_9167" },
  { key: "codeforces", label: "Codeforces Username", placeholder: "e.g. tourist" },
  { key: "codechef", label: "CodeChef Username", placeholder: "e.g. gennady.korotkevich" },
] as const;

type ProfileKey = (typeof PROFILE_FIELDS)[number]["key"];

const GITHUB_URL_RE = /^(https?:\/\/)([a-zA-Z0-9-]+\.)*github\.com\/[A-Za-z0-9][A-Za-z0-9_.-]*$/;
const LINKEDIN_URL_RE = /^(https?:\/\/)([a-zA-Z0-9-]+\.)*linkedin\.com\/in\/[A-Za-z0-9][A-Za-z0-9_-]*$/;

export default function StudentForm({
  open,
  editingStudent,
  submitting,
  error,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  editingStudent: Student | null;
  submitting: boolean;
  error: string | null;
  onSubmit: (payload: {
    rollNumber: string;
    name: string;
    email: string;
    branch?: string;
    year?: number;
    section?: string;
    phone?: string;
    githubProfileUrl?: string;
    linkedinProfileUrl?: string;
    leetcodeUsername?: string;
    codeforcesUsername?: string;
    codechefUsername?: string;
    sync?: boolean;
  }) => void;
  onCancel: () => void;
}) {
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [phone, setPhone] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Record<ProfileKey, string>>({
    leetcode: "",
    codeforces: "",
    codechef: "",
  });

  useEffect(() => {
    if (!open) return;
    if (editingStudent) {
      setRollNumber(editingStudent.rollNumber);
      setName(editingStudent.name);
      setEmail(editingStudent.email);
      setBranch(editingStudent.branch ?? "");
      setYear(editingStudent.year ? String(editingStudent.year) : "");
      setSection(editingStudent.section ?? "");
      setPhone(editingStudent.phone ?? "");
      setGithubUrl(editingStudent.githubProfileUrl ?? "");
      setLinkedinUrl(editingStudent.linkedinProfileUrl ?? "");
      setProfiles({ leetcode: "", codeforces: "", codechef: "" });
      codingProfileService
        .getProfile(editingStudent.id)
        .then((profile) => {
          setProfiles({
            leetcode: profile?.leetcodeUsername ?? "",
            codeforces: profile?.codeforcesUsername ?? "",
            codechef: profile?.codechefUsername ?? "",
          });
        })
        .catch(() => {
          // profile may not exist yet; keep fields empty
        });
    } else {
      setRollNumber("");
      setName("");
      setEmail("");
      setBranch("");
      setYear("");
      setSection("");
      setPhone("");
      setGithubUrl("");
      setLinkedinUrl("");
      setProfiles({ leetcode: "", codeforces: "", codechef: "" });
    }
    setFieldError(null);
  }, [open, editingStudent]);

  function handleSubmit(e: FormEvent, sync: boolean) {
    e.preventDefault();
    if (!phone.trim()) {
      setFieldError("Phone number is required");
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setFieldError("Phone number must be exactly 10 digits");
      return;
    }
    if (!githubUrl.trim()) {
      setFieldError("GitHub profile is required");
      return;
    }
    if (!GITHUB_URL_RE.test(githubUrl.trim())) {
      setFieldError("Please enter a valid GitHub profile URL");
      return;
    }
    if (!linkedinUrl.trim()) {
      setFieldError("LinkedIn profile is required");
      return;
    }
    if (!LINKEDIN_URL_RE.test(linkedinUrl.trim())) {
      setFieldError("Please enter a valid LinkedIn profile URL");
      return;
    }
    setFieldError(null);
    onSubmit({
      rollNumber,
      name,
      email,
      branch: branch || undefined,
      year: year ? Number(year) : undefined,
      section: section || undefined,
      phone: phone.trim(),
      githubProfileUrl: githubUrl.trim(),
      linkedinProfileUrl: linkedinUrl.trim(),
      leetcodeUsername: profiles.leetcode.trim() || undefined,
      codeforcesUsername: profiles.codeforces.trim() || undefined,
      codechefUsername: profiles.codechef.trim() || undefined,
      sync,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingStudent ? "Edit Student" : "Add Student"}</DialogTitle>
          <DialogDescription>
            {editingStudent ? "Update the student's details below." : "Register a new student in CodeTrack."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => handleSubmit(e, false)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rollNumber">Roll Number *</Label>
            <Input
              id="rollNumber"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g. 21CS001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@college.edu"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="e.g. CSE"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              min={1}
              max={4}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="section">Section</Label>
            <Input
              id="section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. A"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9999999999"
              inputMode="numeric"
              maxLength={10}
              required
            />
          </div>

          <div className="sm:col-span-2 mt-2 border-t pt-4">
            <p className="text-sm font-semibold">Profile Links</p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="githubProfileUrl">GitHub Profile URL *</Label>
                <Input
                  id="githubProfileUrl"
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="e.g. https://github.com/username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedinProfileUrl">LinkedIn Profile URL *</Label>
                <Input
                  id="linkedinProfileUrl"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="e.g. https://www.linkedin.com/in/username"
                  required
                />
              </div>
            </div>
          </div>

          <div className="sm:col-span-2 mt-2 border-t pt-4">
            <p className="text-sm font-semibold">Coding Profiles</p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            </div>
          </div>

          {(fieldError || error) && <p className="sm:col-span-2 text-sm text-destructive">{fieldError || error}</p>}

          <DialogFooter className="sm:col-span-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Saving..." : editingStudent ? "Update Student" : "Save Student"}
            </Button>
            {editingStudent && (
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={(e) => handleSubmit(e, true)}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Update &amp; Sync
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}