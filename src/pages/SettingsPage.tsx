import { useState } from "react";
import { Settings as SettingsIcon, Moon, Sun, Loader2, KeyRound, UserRound } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../components/AppLayout";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import * as authService from "../services/authService";

export default function SettingsPage() {
  const { admin, logout } = useAuth();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("codetrack_theme", next ? "dark" : "light");
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success("Password changed — please log in again.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      logout();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <PageHeader
        icon={<SettingsIcon className="h-6 w-6" />}
        title="Settings"
        description="Admin profile, security, and appearance."
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              Admin Profile
            </CardTitle>
            <CardDescription>Your CodeTrack account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white">
                {admin?.email?.charAt(0).toUpperCase() ?? "A"}
              </div>
              <div>
                <p className="font-semibold">{admin?.fullName ?? "Admin"}</p>
                <p className="text-xs text-muted-foreground">{admin?.email}</p>
              </div>
            </div>
            <Separator />
            {admin?.collegeName && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">College</span>
                <span className="font-medium">{admin.collegeName}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">Administrator</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Change Password
            </CardTitle>
            <CardDescription>You'll be logged out after a successful change.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Switch between light and dark themes.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Button variant="outline" onClick={toggleTheme}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {dark ? "Switch to Light" : "Switch to Dark"}
            </Button>
            <span className="text-sm text-muted-foreground">Currently: {dark ? "Dark" : "Light"} mode</span>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
