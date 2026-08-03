import { api } from "./api";

export interface AdminSummary {
  id: string;
  email: string;
  fullName?: string;
  collegeName?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  admin: AdminSummary;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post("/auth/change-password", { currentPassword, newPassword });
}

export async function changeEmail(currentPassword: string, newEmail: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/change-email", { currentPassword, newEmail });
  return data;
}
