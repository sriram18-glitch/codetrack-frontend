import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Student } from "../services/studentService";
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

  useEffect(() => {
    if (open) {
      if (editingStudent) {
        setRollNumber(editingStudent.rollNumber);
        setName(editingStudent.name);
        setEmail(editingStudent.email);
        setBranch(editingStudent.branch ?? "");
        setYear(editingStudent.year ? String(editingStudent.year) : "");
        setSection(editingStudent.section ?? "");
        setPhone(editingStudent.phone ?? "");
      } else {
        setRollNumber("");
        setName("");
        setEmail("");
        setBranch("");
        setYear("");
        setSection("");
        setPhone("");
      }
    }
  }, [open, editingStudent]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      rollNumber,
      name,
      email,
      branch: branch || undefined,
      year: year ? Number(year) : undefined,
      section: section || undefined,
      phone: phone || undefined,
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              max={6}
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
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
            />
          </div>

          {error && <p className="sm:col-span-2 text-sm text-destructive">{error}</p>}

          <DialogFooter className="sm:col-span-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Saving..." : editingStudent ? "Update Student" : "Save Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
