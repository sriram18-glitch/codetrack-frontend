import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Loader2, CheckCircle2, XCircle, UserPlus, ArrowLeft } from "lucide-react";
import * as registerService from "../services/registerService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

type Platform = "leetcode" | "codeforces" | "codechef";
type UsernameStatus = "idle" | "checking" | "valid" | "invalid";

const USERNAME_FIELDS: { key: Platform; label: string; placeholder: string }[] = [
  { key: "leetcode", label: "LeetCode Username", placeholder: "e.g. sriram_9167" },
  { key: "codeforces", label: "Codeforces Username", placeholder: "e.g. tourist" },
  { key: "codechef", label: "CodeChef Username", placeholder: "e.g. gennady.korotkevich" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [phone, setPhone] = useState("");
  const [usernames, setUsernames] = useState<Record<Platform, string>>({
    leetcode: "",
    codeforces: "",
    codechef: "",
  });
  const [status, setStatus] = useState<Record<Platform, UsernameStatus>>({
    leetcode: "idle",
    codeforces: "idle",
    codechef: "idle",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<registerService.RegisterResponse | null>(null);

  async function validateField(platform: Platform) {
    const username = usernames[platform].trim();
    if (!username) {
      setStatus((s) => ({ ...s, [platform]: "idle" }));
      return;
    }
    setStatus((s) => ({ ...s, [platform]: "checking" }));
    try {
      const valid = await registerService.validateUsername(platform, username);
      setStatus((s) => ({ ...s, [platform]: valid ? "valid" : "invalid" }));
    } catch {
      setStatus((s) => ({ ...s, [platform]: "invalid" }));
    }
  }

  function updateUsername(platform: Platform, value: string) {
    setUsernames((u) => ({ ...u, [platform]: value }));
    setStatus((s) => ({ ...s, [platform]: "idle" }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const required = { "Roll number": rollNumber, Name: name, Email: email, Branch: branch, Year: year, Section: section };
    for (const [label, value] of Object.entries(required)) {
      if (!value.trim()) {
        setError(`${label} is required`);
        return;
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    const yearNum = Number(year);
    if (!Number.isInteger(yearNum) || yearNum < 1 || yearNum > 4) {
      setError("Year must be between 1 and 4");
      return;
    }

    setLoading(true);
    try {
      for (const { key } of USERNAME_FIELDS) {
        const username = usernames[key].trim();
        if (!username) continue;
        const valid = await registerService.validateUsername(key, username);
        setStatus((s) => ({ ...s, [key]: valid ? "valid" : "invalid" }));
        if (!valid) {
          setError(`${USERNAME_FIELDS.find((f) => f.key === key)!.label} "${username}" does not exist`);
          return;
        }
      }

      const response = await registerService.registerStudent({
        rollNumber,
        name,
        email,
        branch,
        year: yearNum,
        section,
        phone: phone || undefined,
        leetcodeUsername: usernames.leetcode.trim() || undefined,
        codeforcesUsername: usernames.codeforces.trim() || undefined,
        codechefUsername: usernames.codechef.trim() || undefined,
      });
      setSuccess(response);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

        <Card className="relative w-full max-w-md text-center">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle className="mt-4 text-2xl">Registration Successful</CardTitle>
            <CardDescription>
              Welcome to CodeTrack, {success.name}. Your profile has been created.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 text-left text-sm">
              <p><span className="text-muted-foreground">Roll Number:</span> <span className="font-medium">{success.rollNumber}</span></p>
              <p className="mt-1"><span className="text-muted-foreground">Email:</span> <span className="font-medium">{email}</span></p>
            </div>
            <p className="text-sm text-muted-foreground">
              Your details now appear on the admin dashboard. Platform data will be populated when your
              profiles are synced.
            </p>
            <Button className="w-full" variant="outline" onClick={() => navigate("/login")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <Card className="relative w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-7 w-7" />
          </div>
          <CardTitle className="mt-4 text-2xl">Create Your CodeTrack Account</CardTitle>
          <CardDescription>
            Register once so your coding profiles and performance can be tracked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-semibold">Personal Details</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <Label htmlFor="branch">Branch *</Label>
                  <Input
                    id="branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. CSE"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger id="year">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Year 1</SelectItem>
                      <SelectItem value="2">Year 2</SelectItem>
                      <SelectItem value="3">Year 3</SelectItem>
                      <SelectItem value="4">Year 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section *</Label>
                  <Input
                    id="section"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. A"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9999999999"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="mb-1 text-sm font-semibold">Coding Profiles</p>
              <p className="mb-3 text-xs text-muted-foreground">
                Enter your platform usernames so your progress can be tracked. Each one is verified live.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {USERNAME_FIELDS.map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{label}</Label>
                    <div className="relative">
                      <Input
                        id={key}
                        value={usernames[key]}
                        onChange={(e) => updateUsername(key, e.target.value)}
                        onBlur={() => validateField(key)}
                        placeholder={placeholder}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {status[key] === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {status[key] === "valid" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        {status[key] === "invalid" && <XCircle className="h-4 w-4 text-destructive" />}
                      </span>
                    </div>
                    {status[key] === "valid" && <p className="text-xs text-emerald-500">✓ Username found</p>}
                    {status[key] === "invalid" && <p className="text-xs text-destructive">✕ Username does not exist</p>}
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {loading ? "Registering..." : "Create Account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button type="button" onClick={() => navigate("/login")} className="font-medium text-primary hover:underline">
                Log in
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
