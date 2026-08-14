import { api } from "./api";

export type BulkSyncPlatform = "ALL" | "LEETCODE" | "CODEFORCES" | "CODECHEF";
export type SyncState = "IDLE" | "RUNNING" | "COMPLETED" | "FAILED";

export interface SyncStatus {
  status: SyncState;
  platform: BulkSyncPlatform | null;
  totalStudents: number;
  processed: number;
  synced: number;
  skipped: number;
  failed: number;
  startedAt: string | null;
  completedAt: string | null;
  message: string | null;
}

const SYNC_URLS: Record<BulkSyncPlatform, string> = {
  ALL: "/admin/sync/all",
  LEETCODE: "/admin/sync/leetcode",
  CODEFORCES: "/admin/sync/codeforces",
  CODECHEF: "/admin/sync/codechef",
};

export async function startBulkSync(platform: BulkSyncPlatform): Promise<SyncStatus> {
  const { data } = await api.post<SyncStatus>(SYNC_URLS[platform]);
  return data;
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const { data } = await api.get<SyncStatus>("/admin/sync/status");
  return data;
}