import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Loader2, CheckCircle2, XCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import {
  BulkSyncPlatform,
  SyncStatus,
  getSyncStatus,
  startBulkSync,
} from "../services/bulkSyncService";

const PLATFORM_BUTTONS: { platform: BulkSyncPlatform; label: string; secondary?: boolean }[] = [
  { platform: "ALL", label: "Sync All Students" },
  { platform: "LEETCODE", label: "Sync All LeetCode" },
  { platform: "CODEFORCES", label: "Sync All Codeforces" },
  { platform: "CODECHEF", label: "Sync All CodeChef" },
];

export default function BulkSyncPanel() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [starting, setStarting] = useState<BulkSyncPlatform | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const current = await getSyncStatus();
      setStatus(current);
      return current;
    } catch {
      return null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollTimer.current = setInterval(async () => {
      const current = await refresh();
      if (current && current.status !== "RUNNING") {
        stopPolling();
      }
    }, 2000);
  }, [refresh, stopPolling]);

  useEffect(() => {
    (async () => {
      const current = await refresh();
      if (current && current.status === "RUNNING") {
        startPolling();
      }
    })();
    return stopPolling;
  }, [refresh, startPolling, stopPolling]);

  const running = status?.status === "RUNNING";

  async function handleStart(platform: BulkSyncPlatform) {
    setStarting(platform);
    setError(null);
    try {
      const started = await startBulkSync(platform);
      setStatus(started);
      startPolling();
      toast.success(
        platform === "ALL"
          ? "Synchronization started for all students."
          : `Synchronization started for all ${platform.toLowerCase()} handles.`
      );
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Could not start the synchronization.";
      setError(message);
      if (err?.response?.status === 409) {
        toast.error(message);
      } else {
        toast.error(message);
      }
    } finally {
      setStarting(null);
    }
  }

  const percent = status && status.totalStudents > 0
    ? Math.round((status.processed / status.totalStudents) * 100)
    : 0;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" />
          Bulk Synchronization
        </CardTitle>
        <CardDescription>
          Refresh platform data for every student at once. Runs in the background — you can keep
          using CodeTrack while it syncs. One failing student never stops the rest.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {PLATFORM_BUTTONS.map(({ platform, label }) => {
            const disabled = running || starting !== null;
            const isLoading = starting === platform;
            return (
              <Button
                key={platform}
                variant={platform === "ALL" ? "default" : "outline"}
                size={platform === "ALL" ? "lg" : "default"}
                disabled={disabled}
                onClick={() => handleStart(platform)}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {label}
              </Button>
            );
          })}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {status && status.status !== "IDLE" && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  {status.status === "RUNNING" && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Syncing students...
                    </>
                  )}
                  {status.status === "COMPLETED" && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Sync Completed
                    </>
                  )}
                  {status.status === "FAILED" && (
                    <>
                      <XCircle className="h-4 w-4 text-destructive" />
                      Sync Failed
                    </>
                  )}
                </span>
                {status.status !== "RUNNING" && status.platform && (
                  <span className="text-muted-foreground">
                    Platform: {status.platform === "ALL" ? "All platforms" : status.platform}
                  </span>
                )}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Processed {status.processed} / {status.totalStudents}
                  </span>
                  <span className="font-medium">{status.totalStudents > 0 ? `${percent}%` : "—"}</span>
                </div>
                <Progress value={percent} />
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-green-700 dark:text-green-500">Synced: {status.synced}</span>
                <span className="text-muted-foreground">Skipped: {status.skipped}</span>
                <span className="text-destructive">Failed: {status.failed}</span>
                {status.totalStudents > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Total: {status.totalStudents}
                  </span>
                )}
              </div>

              {status.status === "FAILED" && status.message && (
                <p className="text-sm text-destructive">{status.message}</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}