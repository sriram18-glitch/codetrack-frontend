import { api } from "./api";

export interface Performance {
  studentId: string;
  rollNumber: string;
  name: string;
  overallScore: number | null;
  consistencyScore: number | null;
  leetcodeRating: number | null;
  leetcodeSolved: number | null;
  leetcodeEasy: number | null;
  leetcodeMedium: number | null;
  leetcodeHard: number | null;
  codeforcesRating: number | null;
  codeforcesSolved: number | null;
  codeforcesMaxRating: number | null;
  codeforcesRank: string | null;
  codeforcesContestCount: number | null;
  codechefRating: number | null;
  codechefSolved: number | null;
  codechefStars: string | null;
  codechefGlobalRank: number | null;
  lastUpdated: string | null;
}

export interface PerformanceHistoryPoint {
  id: string;
  platform: string;
  rating: number | null;
  problemsSolved: number | null;
  capturedAt: string;
}

export interface PlatformResult {
  platform: string;
  success: boolean;
  message: string;
}

export interface SyncAllResult {
  results: PlatformResult[];
}

export type PlatformKey = "LEETCODE" | "CODEFORCES" | "CODECHEF";

export async function getPerformance(studentId: string): Promise<Performance> {
  const { data } = await api.get<Performance>(`/students/${studentId}/performance`);
  return data;
}

export async function getHistory(studentId: string): Promise<PerformanceHistoryPoint[]> {
  const { data } = await api.get<PerformanceHistoryPoint[]>(`/students/${studentId}/performance/history`);
  return data;
}

export async function syncPlatform(studentId: string, platform: PlatformKey): Promise<Performance> {
  const { data } = await api.post<Performance>(`/students/${studentId}/performance/sync/${platform.toLowerCase()}`);
  return data;
}

export async function syncAll(studentId: string): Promise<SyncAllResult> {
  const { data } = await api.post<SyncAllResult>(`/students/${studentId}/performance/sync/all`);
  return data;
}

export async function downloadReport(studentId: string): Promise<void> {
  const response = await api.get<Blob>(`/reports/students/${studentId}/pdf`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = "student-report.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
