import { api } from "./api";

export interface RegisterRequest {
  rollNumber: string;
  name: string;
  email: string;
  branch: string;
  year: number;
  section: string;
  phone?: string;
  leetcodeUsername?: string;
  codeforcesUsername?: string;
  codechefUsername?: string;
}

export interface RegisterResponse {
  studentId: string;
  rollNumber: string;
  name: string;
  message: string;
}

export async function registerStudent(payload: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>("/register", payload);
  return data;
}

export async function validateUsername(platform: "leetcode" | "codeforces" | "codechef", username: string): Promise<boolean> {
  const { data } = await api.get<{ valid: boolean }>("/register/validate", {
    params: { platform, username },
  });
  return data.valid;
}
