import { api } from "./api";

export interface CodingProfile {
  id: string;
  studentId: string;
  leetcodeUsername?: string | null;
  codeforcesUsername?: string | null;
  codechefUsername?: string | null;
}

export interface CodingProfileRequest {
  leetcodeUsername?: string;
  codeforcesUsername?: string;
  codechefUsername?: string;
}

export async function getProfile(studentId: string): Promise<CodingProfile | null> {
  try {
    const { data } = await api.get<CodingProfile>(`/students/${studentId}/coding-profile`);
    return data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function upsertProfile(
  studentId: string,
  payload: CodingProfileRequest
): Promise<CodingProfile> {
  const { data } = await api.put<CodingProfile>(`/students/${studentId}/coding-profile`, payload);
  return data;
}