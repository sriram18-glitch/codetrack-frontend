import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { PageHeader } from "../components/PageHeader";
import * as analyticsService from "../services/analyticsService";
import type { AtRiskStudent } from "../services/analyticsService";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

export default function AtRiskPage() {
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsService
      .getAtRisk()
      .then(setAtRisk)
      .catch((err: any) => setError(err?.response?.data?.message ?? "Could not load at-risk students."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <PageHeader
        icon={<AlertTriangle className="h-6 w-6" />}
        title="At-Risk Students"
        description="Students flagged for low readiness scores, missing data, or inactivity — the ones placement coordinators should reach out to first."
      />

      {loading && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && atRisk.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed p-10 text-center">
          <p className="font-semibold">No students currently at risk</p>
          <p className="mt-1 text-sm text-muted-foreground">Nice — every tracked student is healthy.</p>
        </div>
      )}

      {!loading && !error && atRisk.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {atRisk.map((student) => (
            <Card key={student.studentId}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.rollNumber}
                      {student.branch ? ` · ${student.branch}` : ""}
                    </p>
                  </div>
                  <Badge variant="danger">{student.overallScore != null ? student.overallScore.toFixed(2) : "—"}</Badge>
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {student.reason}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Last synced: {student.lastSynced ? new Date(student.lastSynced).toLocaleDateString() : "Never"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
