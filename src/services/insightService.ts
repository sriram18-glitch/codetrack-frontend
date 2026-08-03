import { api } from "./api";

export interface Insight {
  severity: string;
  text: string;
}

export interface InsightResponse {
  studentId: string;
  studentName: string;
  overallScore: number | null;
  insights: Insight[];
}

export async function getInsights(studentId: string): Promise<InsightResponse> {
  const { data } = await api.get<InsightResponse>(`/students/${studentId}/insights`);
  return data;
}
