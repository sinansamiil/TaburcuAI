import type {
  CaseResponse,
  QuestionsResponse,
  StaffCasesResponse,
  SubmitAnswersResponse,
} from "../types";

export interface HealthResponse {
  status: string;
  service: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch("/health");
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: fetchHealth,
};

export async function createCase(rawText: string, disease: string = "heart_failure"): Promise<CaseResponse> {
  const res = await fetch("/api/v1/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw_text: rawText, disease }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Epikriz işleme hatası: ${res.status}`);
  }
  return res.json();
}

export async function getCase(caseId: string): Promise<CaseResponse> {
  const res = await fetch(`/api/v1/cases/${caseId}`);
  if (!res.ok) {
    throw new Error(`Vaka bulunamadı: ${res.status}`);
  }
  return res.json();
}

export async function getCaseQuestions(caseId: string): Promise<QuestionsResponse> {
  const res = await fetch(`/api/v1/cases/${caseId}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Soru üretme hatası: ${res.status}`);
  }
  return res.json();
}

export async function submitAnswers(
  caseId: string,
  answers: { question_id: string; answer: string }[]
): Promise<SubmitAnswersResponse> {
  const res = await fetch(`/api/v1/cases/${caseId}/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) {
    throw new Error(`Cevap gönderme hatası: ${res.status}`);
  }
  return res.json();
}

export async function getStaffCases(): Promise<StaffCasesResponse> {
  const res = await fetch("/api/v1/staff/cases");
  if (!res.ok) {
    throw new Error(`Personel vaka listesi alınamadı: ${res.status}`);
  }
  return res.json();
}
