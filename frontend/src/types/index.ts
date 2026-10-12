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

export interface CaseResponse {
  id: string;
  disease: string;
  raw_text: string;
  discharge_info: DischargeInfo;
  simplified_plan: SimplifiedPlan;
  created_at: string;
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
}

export interface StaffCasesResponse {
  total: number;
  cases: StaffCaseSummary[];
}
