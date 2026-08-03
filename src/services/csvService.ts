import { api } from "./api";

export interface CsvImportResult {
  imported: number;
  failed: number;
  errors: string[];
}

export async function importCsv(file: File): Promise<CsvImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<CsvImportResult>("/students/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function exportCsv(): Promise<void> {
  const response = await api.get<Blob>("/students/export", { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = "students.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
