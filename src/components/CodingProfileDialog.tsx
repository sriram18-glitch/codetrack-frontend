import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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

const FIELDS = [
  { key: "leetcode", label: "LeetCode Username", placeholder: "e.g. tourist" },
  { key: "codeforces", label: "Codeforces Username", placeholder: "e.g. tourist" },
  { key: "codechef", label: "CodeChef Username", placeholder: "e.g. gennady.korotkevich" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

export default function CodingProfileDialog({
  open,
  student,
  onClose,
}: {
  open: boolean;
  student: Student | null;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    leetcode: "",
    codeforces: "",
    codechef: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && student) {
      setError(null);
      setLoading(true);
      codingProfileService
        .getProfile(student.id)
        .then((profile) => {
          setValues({
            leetcode: profile?.leetcodeUsername ?? "",
            codeforces: profile?.codeforcesUsername ?? "",
            codechef: profile?.codechefUsername ?? "",
          });
        })
        .catch((err: any) => setError(err?.response?.data?.message ?? "Could not load existing profile."))
        .finally(() => setLoading(false));
    }
  }, [open, student]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!student) return;
    setSaving(true);
    setError(null);
    try {
      await codingProfileService.upsertProfile(student.id, {
        leetcodeUsername: values.leetcode || undefined,
        codeforcesUsername: values.codeforces || undefined,
        codechefUsername: values.codechef || undefined,
      });
      toast.success("Coding profiles saved for " + student.name);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Could not save coding profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Coding Profiles</DialogTitle>
          <DialogDescription>
            {student ? `${student.name} (${student.rollNumber})` : ""} — set the handles used for live syncs.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading existing profile...
          </div>
        ) : (
          <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={values[key]}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                  placeholder={placeholder}
                />
              </div>
            ))}

            {error && <p className="sm:col-span-2 text-sm text-destructive">{error}</p>}

            <DialogFooter className="sm:col-span-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Save Profiles"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
