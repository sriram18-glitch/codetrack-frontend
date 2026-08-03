import { api } from "./api";

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  branch?: string;
  year?: number;
  section?: string;
  phone?: string;
  createdAt: string;
}

export interface CreateStudentRequest {
  rollNumber: string;
  name: string;
  email: string;
  branch?: string;
  year?: number;
  section?: string;
  phone?: string;
}

export async function listStudents(): Promise<Student[]> {
  const { data } = await api.get<Student[]>("/students");
  return data;
}

export async function searchStudents(q: string): Promise<Student[]> {
  const { data } = await api.get<Student[]>("/students", { params: { q } });
  return data;
}

export async function getStudent(id: string): Promise<Student> {
  const { data } = await api.get<Student>(`/students/${id}`);
  return data;
}

export async function getStudentByRoll(rollNumber: string): Promise<Student> {
  const { data } = await api.get<Student>(`/students/roll/${encodeURIComponent(rollNumber)}`);
  return data;
}

export async function createStudent(payload: CreateStudentRequest): Promise<Student> {
  const { data } = await api.post<Student>("/students", payload);
  return data;
}

export async function updateStudent(id: string, payload: CreateStudentRequest): Promise<Student> {
  const { data } = await api.put<Student>(`/students/${id}`, payload);
  return data;
}

export async function deleteStudent(id: string): Promise<void> {
  await api.delete(`/students/${id}`);
}