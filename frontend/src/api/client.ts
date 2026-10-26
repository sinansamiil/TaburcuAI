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

export async function uploadCaseDocument(file: File, disease: string = "heart_failure"): Promise<CaseResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("disease", disease);
  const res = await fetch("/api/v1/cases/upload", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Belge analiz hatası: ${res.status}`);
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

export async function getCaseReview(caseId: string): Promise<import("../types").StaffCaseReview> {
  const res = await fetch(`/api/v1/staff/cases/${caseId}/review`);
  if (!res.ok) {
    throw new Error(`Vaka inceleme detayı alınamadı: ${res.status}`);
  }
  return res.json();
}

export async function submitCaseAction(
  caseId: string,
  payload: { action: string; note?: string; author?: string }
): Promise<import("../types").WorkflowInfo> {
  const res = await fetch(`/api/v1/staff/cases/${caseId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Aksiyon kaydedilemedi: ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Hospital White-Labeling & Customization APIs
// ---------------------------------------------------------------------------

export async function getHospitalConfig(): Promise<import("../types").HospitalConfig> {
  const res = await fetch("/api/v1/hospital/config");
  if (!res.ok) {
    throw new Error(`Hastane yapılandırması alınamadı: ${res.status}`);
  }
  return res.json();
}

export async function updateHospitalConfig(
  payload: import("../types").HospitalConfigUpdate
): Promise<import("../types").HospitalConfig> {
  const res = await fetch("/api/v1/hospital/config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Yapılandırma güncellenemedi: ${res.status}`);
  }
  return res.json();
}

export async function resetHospitalConfig(): Promise<import("../types").HospitalConfig> {
  const res = await fetch("/api/v1/hospital/reset", { method: "POST" });
  if (!res.ok) {
    throw new Error(`Varsayılana sıfırlanamadı: ${res.status}`);
  }
  return res.json();
}

export async function getHospitalPresets(): Promise<{ presets: import("../types").HospitalPreset[] }> {
  const res = await fetch("/api/v1/hospital/presets");
  if (!res.ok) {
    throw new Error(`Hazır temalar alınamadı: ${res.status}`);
  }
  return res.json();
}

export async function applyHospitalPreset(presetKey: string): Promise<import("../types").HospitalConfig> {
  const res = await fetch(`/api/v1/hospital/presets/${presetKey}/apply`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Tema uygulanamadı: ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Doctor & Nurse Management APIs
// ---------------------------------------------------------------------------

export async function getDoctors(): Promise<import("../types").Doctor[]> {
  const res = await fetch("/api/v1/management/doctors");
  if (!res.ok) throw new Error("Doktorlar listelenemedi");
  return res.json();
}

export async function createDoctor(payload: import("../types").DoctorCreate): Promise<import("../types").Doctor> {
  const res = await fetch("/api/v1/management/doctors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Doktor eklenemedi");
  return res.json();
}

export async function updateDoctor(
  id: string,
  payload: Partial<import("../types").DoctorCreate>
): Promise<import("../types").Doctor> {
  const res = await fetch(`/api/v1/management/doctors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Doktor güncellenemedi");
  return res.json();
}

export async function deleteDoctor(id: string): Promise<void> {
  const res = await fetch(`/api/v1/management/doctors/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Doktor silinemedi");
}

export async function getNurses(): Promise<import("../types").Nurse[]> {
  const res = await fetch("/api/v1/management/nurses");
  if (!res.ok) throw new Error("Hemşireler listelenemedi");
  return res.json();
}

export async function createNurse(payload: import("../types").NurseCreate): Promise<import("../types").Nurse> {
  const res = await fetch("/api/v1/management/nurses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Hemşire eklenemedi");
  return res.json();
}

export async function updateNurse(
  id: string,
  payload: Partial<import("../types").NurseCreate>
): Promise<import("../types").Nurse> {
  const res = await fetch(`/api/v1/management/nurses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Hemşire güncellenemedi");
  return res.json();
}

export async function deleteNurse(id: string): Promise<void> {
  const res = await fetch(`/api/v1/management/nurses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Hemşire silinemedi");
}

// ---------------------------------------------------------------------------
// Patient Management & History APIs
// ---------------------------------------------------------------------------

export async function getPatients(query?: string): Promise<import("../types").Patient[]> {
  const url = query ? `/api/v1/management/patients?query=${encodeURIComponent(query)}` : "/api/v1/management/patients";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Hastalar listelenemedi");
  return res.json();
}

export async function createPatient(payload: import("../types").PatientCreate): Promise<import("../types").Patient> {
  const res = await fetch("/api/v1/management/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Hasta eklenemedi");
  }
  return res.json();
}

export async function updatePatient(
  id: string,
  payload: Partial<import("../types").PatientCreate>
): Promise<import("../types").Patient> {
  const res = await fetch(`/api/v1/management/patients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Hasta güncellenemedi");
  return res.json();
}

export async function deletePatient(id: string): Promise<void> {
  const res = await fetch(`/api/v1/management/patients/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Hasta silinemedi");
}

export async function getPatientHistory(identifier: string): Promise<import("../types").PatientHistoryResponse> {
  const res = await fetch(`/api/v1/management/patients/${encodeURIComponent(identifier)}/history`);
  if (!res.ok) throw new Error("Hasta taburculuk geçmişi alınamadı");
  return res.json();
}

// ---------------------------------------------------------------------------
// Disease Protocols Management APIs
// ---------------------------------------------------------------------------

export async function getDiseases(): Promise<import("../types").DiseaseConfig[]> {
  const res = await fetch("/api/v1/management/diseases");
  if (!res.ok) throw new Error("Hastalık protokolleri alınamadı");
  return res.json();
}

export async function createDisease(
  payload: import("../types").DiseaseConfigCreate
): Promise<import("../types").DiseaseConfig> {
  const res = await fetch("/api/v1/management/diseases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Hastalık protokolü eklenemedi");
  return res.json();
}

export async function deleteDisease(id: string): Promise<void> {
  const res = await fetch(`/api/v1/management/diseases/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Hastalık protokolü silinemedi");
}

// ---------------------------------------------------------------------------
// Clinical Assistant Chatbot & FAQ APIs
// ---------------------------------------------------------------------------

export async function getFaqs(
  category?: string,
  search?: string
): Promise<import("../types").FAQItem[]> {
  const params = new URLSearchParams();
  if (category && category !== "all") params.append("category", category);
  if (search) params.append("search", search);
  const url = `/api/v1/chatbot/faq${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("SSS içerikleri alınamadı");
  return res.json();
}

export async function askChatbot(
  query: string,
  disease?: string | null
): Promise<import("../types").ChatResponse> {
  const res = await fetch("/api/v1/chatbot/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, disease }),
  });
  if (!res.ok) throw new Error("Asistan yanıt veremedi");
  return res.json();
}

