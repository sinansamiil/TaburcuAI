/** Frontend TypeScript types matching backend models. */

export interface SourceSpan {
  text: string;
  start?: number | null;
  end?: number | null;
}

export interface SimplifiedMedication {
  name: string;
  dose_text: string;
  slots: ("sabah" | "öğle" | "akşam" | "gece")[];
  timing_text?: string | null;
  purpose?: string | null;
  source_span: SourceSpan;
}

export interface SimplifiedPlan {
  daily_schedule: SimplifiedMedication[];
  daily_routine: string[];
  warning_signs: string[];
  follow_ups: string[];
  disclaimer: string;
}

export interface Medication {
  name: string;
  purpose?: string | null;
  dose_text: string;
  frequency_text: string;
  timing_text?: string | null;
  source_span: SourceSpan;
}

export interface FollowUp {
  when_text: string;
  with_whom?: string | null;
  purpose?: string | null;
  source_span: SourceSpan;
}

export interface DischargeInfo {
  diagnosis_text: string;
  medications: Medication[];
  daily_weight_monitoring?: string | null;
  sodium_restriction?: string | null;
  fluid_restriction?: string | null;
  warning_signs: string[];
  follow_ups: FollowUp[];
  other_instructions?: string | null;
  missing_fields: string[];
}

export interface GDMTItem {
  pillar_id: string;
  name: string;
  short_name: string;
  guideline_class: string;
  target: string;
  status: "prescribed" | "missing";
  matched_drug?: string | null;
  matched_category?: string | null;
  clinical_note: string;
}

export interface ClinicalPhenotype {
  ejection_fraction?: string | null;
  ef_value?: number | null;
  phenotype?: string | null;
  phenotype_code?: string | null;
  nyha_class?: string | null;
  dry_weight?: string | null;
}

export interface GDMTAnalysis {
  pillars_met: number;
  total_pillars: number;
  score_percent: number;
  compliance_level: string;
  badge_variant: "success" | "primary" | "warning" | "danger";
  pillars: GDMTItem[];
  loop_diuretic_prescribed: boolean;
  loop_diuretic_drug?: string | null;
  clinical_recommendations: string[];
}

export interface CaseResponse {
  id: string;
  disease: string;
  raw_text: string;
  discharge_info: DischargeInfo;
  simplified_plan: SimplifiedPlan;
  created_at: string;
  phenotype?: ClinicalPhenotype | null;
  gdmt?: GDMTAnalysis | null;
}

export interface Question {
  id: string;
  type: "open" | "yes_no" | "multiple_choice";
  text: string;
  expected_points: string[];
  linked_item: string;
  criticality: "high" | "medium" | "low";
}

export interface QuestionsResponse {
  case_id: string;
  questions: Question[];
}

export interface AnswerEvaluation {
  question_id: string;
  verdict: "correct" | "partial" | "incorrect" | "unclear";
  matched_points: string[];
  missing_points: string[];
  raw_answer: string;
}

export interface ItemRisk {
  linked_item: string;
  question_id: string;
  verdict: "correct" | "partial" | "incorrect" | "unclear";
  criticality: "high" | "medium" | "low";
  weighted_score: number;
}

export interface RiskReport {
  case_id: string;
  item_risks: ItemRisk[];
  overall_score: number;
  level: "low" | "medium" | "high";
  abstained: boolean;
  reasons: string[];
  suggested_staff_action: string;
}

export interface SubmitAnswersResponse {
  case_id: string;
  evaluations: AnswerEvaluation[];
  risk_report: RiskReport;
  emergency_triggered: boolean;
  emergency_message?: string | null;
}

export interface VerdictCounts {
  correct: number;
  partial: number;
  incorrect: number;
  unclear: number;
  unanswered: number;
}

export interface StaffCaseSummary {
  case_id: string;
  disease: string;
  created_at: string;
  overall_score?: number | null;
  level?: "low" | "medium" | "high" | null;
  reasons: string[];
  suggested_staff_action?: string | null;
  emergency_triggered: boolean;
  has_risk_report: boolean;
  protocol_no: string;
  patient_display?: string | null;
  ward?: string | null;
  diagnosis_text?: string | null;
  workflow_status: "pending" | "contacted" | "education_planned" | "education_done" | "closed";
  verdict_counts: VerdictCounts;
}

export interface StaffCasesResponse {
  total: number;
  cases: StaffCaseSummary[];
}

export interface TranscriptItem {
  question_id: string;
  question_text: string;
  linked_item: string;
  criticality: "high" | "medium" | "low";
  expected_points: string[];
  patient_answer?: string | null;
  verdict?: "correct" | "partial" | "incorrect" | "unclear" | null;
  matched_points: string[];
  missing_points: string[];
  answered_at?: string | null;
}

export interface MedReconItem {
  name: string;
  dose_text: string;
  frequency_text: string;
  timing_text?: string | null;
  source_text?: string | null;
  name_found: boolean;
  dose_found: boolean;
  status: "verified" | "partial" | "not_found";
}

export interface UnextractedDrug {
  generic: string;
  matched_alias: string;
  context?: string | null;
}

export interface MedReconciliation {
  items: MedReconItem[];
  unextracted: UnextractedDrug[];
}

export interface WorkflowEvent {
  action: string;
  label: string;
  note?: string | null;
  author: string;
  at: string;
}

export interface WorkflowInfo {
  protocol_no: string;
  patient_name?: string | null;
  patient_display?: string | null;
  ward?: string | null;
  status: "pending" | "contacted" | "education_planned" | "education_done" | "closed";
  contacted: boolean;
  education_status?: "planned" | "done" | null;
  closed: boolean;
  events: WorkflowEvent[];
}

export interface StaffCaseReview {
  case: CaseResponse;
  workflow: WorkflowInfo;
  transcript: TranscriptItem[];
  reconciliation: MedReconciliation;
  phenotype?: ClinicalPhenotype | null;
  gdmt?: GDMTAnalysis | null;
  risk_report?: RiskReport | null;
  emergency_triggered: boolean;
  emergency_message?: string | null;
}

// ---------------------------------------------------------------------------
// Modular Management & Hospital Types
// ---------------------------------------------------------------------------

export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  email?: string | null;
  phone?: string | null;
  room?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DoctorCreate {
  name: string;
  title?: string;
  specialty: string;
  email?: string;
  phone?: string;
  room?: string;
  is_active?: boolean;
}

export interface Nurse {
  id: string;
  name: string;
  title: string;
  ward: string;
  shift: string;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface NurseCreate {
  name: string;
  title?: string;
  ward: string;
  shift?: string;
  phone?: string;
  is_active?: boolean;
}

export interface Patient {
  id: string;
  protocol_no: string;
  tc_kimlik: string;
  name: string;
  age?: number | null;
  phone?: string | null;
  ward?: string | null;
  assigned_doctor?: string | null;
  primary_disease: string;
  notes?: string | null;
  created_at: string;
}

export interface PatientCreate {
  protocol_no: string;
  tc_kimlik: string;
  name: string;
  age?: number;
  phone?: string;
  ward?: string;
  assigned_doctor?: string;
  primary_disease: string;
  notes?: string;
}

export interface PatientHistoryCaseItem {
  case_id: string;
  disease: string;
  disease_name: string;
  diagnosis_text?: string | null;
  created_at: string;
  risk_level?: string | null;
  overall_score?: number | null;
  workflow_status?: string | null;
}

export interface PatientHistoryResponse {
  patient?: Patient | null;
  cases: PatientHistoryCaseItem[];
}

export interface HospitalConfig {
  id: string;
  hospital_name: string;
  hospital_subtitle: string;
  logo_icon: string;
  logo_url?: string | null;
  primary_color: string;
  accent_color: string;
  phone: string;
  emergency_phone: string;
  address: string;
  email: string;
  active_departments: string[];
  custom_disclaimer: string;
  updated_at: string;
}

export interface HospitalConfigUpdate {
  hospital_name?: string;
  hospital_subtitle?: string;
  logo_icon?: string;
  logo_url?: string | null;
  primary_color?: string;
  accent_color?: string;
  phone?: string;
  emergency_phone?: string;
  address?: string;
  email?: string;
  active_departments?: string[];
  custom_disclaimer?: string;
}

export interface HospitalPreset {
  key: string;
  title: string;
  preview_color: string;
  description: string;
}

export interface DiseaseConfig {
  id: string;
  name: string;
  specialty: string;
  icon: string;
  status: string;
  description: string;
  version: string;
  is_custom: boolean;
  question_count: number;
  created_at?: string | null;
}

export interface DiseaseConfigCreate {
  id: string;
  name: string;
  specialty: string;
  icon?: string;
  status?: string;
  description?: string;
  version?: string;
  is_custom?: boolean;
}

export interface FAQItem {
  id: string;
  category: string;
  category_title: string;
  disease_id?: string | null;
  question: string;
  answer: string;
  warning_level: "info" | "warning" | "danger";
  tags: string[];
  action_link?: string | null;
  action_text?: string | null;
}

export interface ChatRequest {
  query: string;
  disease?: string | null;
  context?: Record<string, any> | null;
}

export interface ChatResponse {
  answer: string;
  matched_faq_id?: string | null;
  warning_level: "info" | "warning" | "danger";
  category?: string | null;
  emergency_detected: boolean;
  suggested_questions: string[];
  action_link?: string | null;
  action_text?: string | null;
}

