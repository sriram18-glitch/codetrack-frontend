import { api } from "./api";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadStudentReport(studentId: string): Promise<void> {
  const res = await api.get<Blob>(`/reports/students/${studentId}/pdf`, { responseType: "blob" });
  download(res.data, `student-report-${studentId.slice(0, 8)}.pdf`);
}

export async function downloadCollegeReport(): Promise<void> {
  const res = await api.get<Blob>(`/reports/college/pdf`, { responseType: "blob" });
  download(res.data, "college-report.pdf");
}

export async function downloadBranchReport(branch: string): Promise<void> {
  const res = await api.get<Blob>(`/reports/branches/${encodeURIComponent(branch)}/pdf`, {
    responseType: "blob",
  });
  download(res.data, `branch-report-${branch}.pdf`);
}

export async function downloadYearReport(year: string): Promise<void> {
  const res = await api.get<Blob>(`/reports/pdf`, {
    params: { year },
    responseType: "blob",
  });
  download(res.data, `year-report-${year}.pdf`);
}

export async function downloadSectionReport(year: string): Promise<void> {
  const res = await api.get<Blob>(`/reports/section/pdf`, {
    params: { year },
    responseType: "blob",
  });
  download(res.data, `section-report-year-${year}.pdf`);
}
