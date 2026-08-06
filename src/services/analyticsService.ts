import { api } from "./api";

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  rollNumber: string;
  name: string;
  branch?: string;
  year?: number;
  section?: string;
  overallScore: number | null;
  consistencyScore: number | null;
  leetcodeSolved: number | null;
  codeforcesRating: number | null;
  codechefRating: number | null;
  totalSolved: number | null;
}

export interface AnalyticsSummary {
  totalStudents: number;
  studentsWithPerformance: number;
  atRiskCount: number;
  averageOverallScore: number;
  averageConsistency: number;
  topPerformer: LeaderboardEntry | null;
}

export interface AtRiskStudent {
  studentId: string;
  rollNumber: string;
  name: string;
  branch?: string;
  overallScore: number | null;
  lastSynced: string | null;
  reason: string;
}

export interface BranchAnalytics {
  branch: string;
  studentCount: number;
  averageOverallScore: number;
  averageConsistency: number;
}

export async function getSummary(): Promise<AnalyticsSummary> {
  const { data } = await api.get<AnalyticsSummary>("/analytics/summary");
  return data;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await api.get<LeaderboardEntry[]>("/analytics/leaderboard");
  return data;
}

export async function getTopSolvers(): Promise<LeaderboardEntry[]> {
  const { data } = await api.get<LeaderboardEntry[]>("/analytics/top-solvers");
  return data;
}

export async function getAtRisk(): Promise<AtRiskStudent[]> {
  const { data } = await api.get<AtRiskStudent[]>("/analytics/at-risk");
  return data;
}

export async function getByBranch(): Promise<BranchAnalytics[]> {
  const { data } = await api.get<BranchAnalytics[]>("/analytics/by-branch");
  return data;
}
