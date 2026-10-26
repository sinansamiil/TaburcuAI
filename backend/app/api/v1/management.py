"""Management API endpoints for Doctors, Nurses, Patients, and Disease Protocols."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.schemas import (
    DoctorCreate,
    DoctorResponse,
    DoctorUpdate,
    NurseCreate,
    NurseResponse,
    NurseUpdate,
    PatientCreate,
    PatientHistoryCaseItem,
    PatientHistoryResponse,
    PatientResponse,
    PatientUpdate,
    DiseaseConfigCreate,
    DiseaseConfigResponse,
)
from app.db.models import (
    CaseModel,
    CaseWorkflowModel,
    DiseaseConfigModel,
    DoctorModel,
    NurseModel,
    PatientModel,
    RiskReportModel,
)
from app.db.session import get_db
from app.diseases.registry import DISEASE_CATALOG, get_disease_module

router = APIRouter(prefix="/management", tags=["Management"])


# ============================================================================
# DOCTOR MANAGEMENT (CRUD)
# ============================================================================


@router.get("/doctors", response_model=list[DoctorResponse])
def list_doctors(
    specialty: str | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
):
    """List all registered doctors, optionally filtered by specialty or active status."""
    query = db.query(DoctorModel)
    if specialty:
        query = query.filter(DoctorModel.specialty.ilike(f"%{specialty}%"))
    if is_active is not None:
        query = query.filter(DoctorModel.is_active == is_active)
    return query.order_by(DoctorModel.name.asc()).all()


@router.post("/doctors", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(payload: DoctorCreate, db: Session = Depends(get_db)):
    """Add a new doctor to the hospital registry."""
    doc = DoctorModel(**payload.model_dump())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.put("/doctors/{doctor_id}", response_model=DoctorResponse)
def update_doctor(doctor_id: str, payload: DoctorUpdate, db: Session = Depends(get_db)):
    """Update doctor details."""
    doc = db.query(DoctorModel).filter(DoctorModel.id == doctor_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doktor bulunamadı.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(doc, field, val)

    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/doctors/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doctor(doctor_id: str, db: Session = Depends(get_db)):
    """Remove a doctor from registry."""
    doc = db.query(DoctorModel).filter(DoctorModel.id == doctor_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doktor bulunamadı.")
    db.delete(doc)
    db.commit()
    return None


# ============================================================================
# NURSE MANAGEMENT (CRUD)
# ============================================================================


@router.get("/nurses", response_model=list[NurseResponse])
def list_nurses(
    ward: str | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
):
    """List all nurses, optionally filtered by ward or status."""
    query = db.query(NurseModel)
    if ward:
        query = query.filter(NurseModel.ward.ilike(f"%{ward}%"))
    if is_active is not None:
        query = query.filter(NurseModel.is_active == is_active)
    return query.order_by(NurseModel.name.asc()).all()


@router.post("/nurses", response_model=NurseResponse, status_code=status.HTTP_201_CREATED)
def create_nurse(payload: NurseCreate, db: Session = Depends(get_db)):
    """Register a new nurse."""
    nurse = NurseModel(**payload.model_dump())
    db.add(nurse)
    db.commit()
    db.refresh(nurse)
    return nurse


@router.put("/nurses/{nurse_id}", response_model=NurseResponse)
def update_nurse(nurse_id: str, payload: NurseUpdate, db: Session = Depends(get_db)):
    """Update nurse details."""
    nurse = db.query(NurseModel).filter(NurseModel.id == nurse_id).first()
    if not nurse:
        raise HTTPException(status_code=404, detail="Hemşire bulunamadı.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(nurse, field, val)

    db.commit()
    db.refresh(nurse)
    return nurse


@router.delete("/nurses/{nurse_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nurse(nurse_id: str, db: Session = Depends(get_db)):
    """Delete a nurse."""
    nurse = db.query(NurseModel).filter(NurseModel.id == nurse_id).first()
    if not nurse:
        raise HTTPException(status_code=404, detail="Hemşire bulunamadı.")
    db.delete(nurse)
    db.commit()
    return None


# ============================================================================
# PATIENT MANAGEMENT & DISCHARGE HISTORY (CRUD)
# ============================================================================


@router.get("/patients", response_model=list[PatientResponse])
def list_patients(
    query: str | None = Query(None, description="Search by name, TC or Protocol"),
    db: Session = Depends(get_db),
):
    """List all registered patients with search support."""
    q = db.query(PatientModel)
    if query:
        pattern = f"%{query}%"
        q = q.filter(
            (PatientModel.name.ilike(pattern))
            | (PatientModel.tc_kimlik.like(pattern))
            | (PatientModel.protocol_no.ilike(pattern))
        )
    return q.order_by(PatientModel.created_at.desc()).all()


@router.post("/patients", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    """Register a new patient."""
    existing = db.query(PatientModel).filter(PatientModel.protocol_no == payload.protocol_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu protokol numarası ile kayıtlı bir hasta zaten var.")

    pat = PatientModel(**payload.model_dump())
    db.add(pat)
    db.commit()
    db.refresh(pat)
    return pat


@router.put("/patients/{patient_id}", response_model=PatientResponse)
def update_patient(patient_id: str, payload: PatientUpdate, db: Session = Depends(get_db)):
    """Update patient info."""
    pat = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not pat:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(pat, field, val)

    db.commit()
    db.refresh(pat)
    return pat


@router.delete("/patients/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: str, db: Session = Depends(get_db)):
    """Delete patient record."""
    pat = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not pat:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı.")
    db.delete(pat)
    db.commit()
    return None


@router.get("/patients/{identifier}/history", response_model=PatientHistoryResponse)
def get_patient_discharge_history(identifier: str, db: Session = Depends(get_db)):
    """
    Fetch all discharge records for a given patient (identified by TC kimlik or Protocol No).
    Allows AI & staff to switch and review disease-specific discharge plans.
    """
    clean_id = identifier.strip().upper()

    # Find patient in patient table
    patient = (
        db.query(PatientModel)
        .filter(
            (PatientModel.protocol_no.ilike(clean_id))
            | (PatientModel.tc_kimlik == clean_id)
            | (PatientModel.id == identifier)
        )
        .first()
    )

    # Find workflows with matching protocol or patient name
    wf_query = db.query(CaseWorkflowModel).filter(CaseWorkflowModel.protocol_no.ilike(clean_id))
    matching_cases = db.query(CaseModel).join(CaseWorkflowModel).filter(CaseWorkflowModel.protocol_no.ilike(clean_id)).all()

    # If nothing found by protocol directly, check if patient name matched
    if not matching_cases and patient:
        matching_cases = (
            db.query(CaseModel)
            .join(CaseWorkflowModel)
            .filter(CaseWorkflowModel.patient_name.ilike(f"%{patient.name}%"))
            .all()
        )

    # Name mapping for disease
    disease_names = {d["id"]: d["name"] for d in DISEASE_CATALOG}
    disease_names["kidney_failure"] = "Kronik Böbrek Yetmezliği (KBY)"
    disease_names["heart_failure"] = "Kalp Yetmezliği (HFrEF/HFpEF)"
    disease_names["diabetes_type2"] = "Tip 2 Diyabet & İnsülin"
    disease_names["copd_respiratory"] = "KOAH & Solunum Takibi"
    disease_names["hypertension"] = "Dirençli Hipertansiyon"

    history_items: list[PatientHistoryCaseItem] = []
    for c in matching_cases:
        rep: RiskReportModel | None = c.risk_report
        wf: CaseWorkflowModel | None = c.workflow
        diag = None
        if isinstance(c.discharge_info, dict):
            diag = c.discharge_info.get("diagnosis_text")

        history_items.append(
            PatientHistoryCaseItem(
                case_id=c.id,
                disease=c.disease,
                disease_name=disease_names.get(c.disease, c.disease.capitalize()),
                diagnosis_text=diag,
                created_at=c.created_at,
                risk_level=rep.level if rep else None,
                overall_score=rep.overall_score if rep else None,
                workflow_status=wf.status if wf else "pending",
            )
        )

    # Sort newest first
    history_items.sort(key=lambda x: -x.created_at.timestamp())

    pat_resp = None
    if patient:
        pat_resp = PatientResponse(
            id=patient.id,
            protocol_no=patient.protocol_no,
            tc_kimlik=patient.tc_kimlik,
            name=patient.name,
            age=patient.age,
            phone=patient.phone,
            ward=patient.ward,
            assigned_doctor=patient.assigned_doctor,
            primary_disease=patient.primary_disease,
            notes=patient.notes,
            created_at=patient.created_at,
        )

    return PatientHistoryResponse(patient=pat_resp, cases=history_items)


# ============================================================================
# DISEASE PROTOCOL MANAGEMENT
# ============================================================================


@router.get("/diseases", response_model=list[DiseaseConfigResponse])
def list_disease_configs(db: Session = Depends(get_db)):
    """List all available clinical disease protocols (catalog + custom)."""
    # Merge catalog with any custom DB overrides
    results: list[DiseaseConfigResponse] = []

    db_customs = {d.id: d for d in db.query(DiseaseConfigModel).all()}

    for cat in DISEASE_CATALOG:
        cid = cat["id"]
        # Count questions
        try:
            mod = get_disease_module(cid)
            q_count = len(mod.question_templates())
        except Exception:
            q_count = 0

        if cid in db_customs:
            custom_entry = db_customs[cid]
            results.append(
                DiseaseConfigResponse(
                    id=custom_entry.id,
                    name=custom_entry.name,
                    specialty=custom_entry.specialty,
                    icon=custom_entry.icon,
                    status=custom_entry.status,
                    description=custom_entry.description,
                    version=custom_entry.version,
                    is_custom=custom_entry.is_custom,
                    question_count=q_count,
                    created_at=custom_entry.created_at,
                )
            )
        else:
            results.append(
                DiseaseConfigResponse(
                    id=cat["id"],
                    name=cat["name"],
                    specialty=cat["specialty"],
                    icon=cat["icon"],
                    status=cat["status"],
                    description=cat["description"],
                    version=cat["version"],
                    is_custom=False,
                    question_count=q_count,
                    created_at=None,
                )
            )

    # Any extra custom disease in DB not in catalog
    for cid, custom_entry in db_customs.items():
        if not any(c["id"] == cid for c in DISEASE_CATALOG):
            results.append(
                DiseaseConfigResponse(
                    id=custom_entry.id,
                    name=custom_entry.name,
                    specialty=custom_entry.specialty,
                    icon=custom_entry.icon,
                    status=custom_entry.status,
                    description=custom_entry.description,
                    version=custom_entry.version,
                    is_custom=True,
                    question_count=0,
                    created_at=custom_entry.created_at,
                )
            )

    return results


@router.post("/diseases", response_model=DiseaseConfigResponse, status_code=status.HTTP_201_CREATED)
def create_custom_disease(payload: DiseaseConfigCreate, db: Session = Depends(get_db)):
    """Add a new custom disease module / protocol."""
    existing = db.query(DiseaseConfigModel).filter(DiseaseConfigModel.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu hastalık ID'si zaten mevcut.")

    d = DiseaseConfigModel(**payload.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)

    return DiseaseConfigResponse(
        id=d.id,
        name=d.name,
        specialty=d.specialty,
        icon=d.icon,
        status=d.status,
        description=d.description,
        version=d.version,
        is_custom=True,
        question_count=0,
        created_at=d.created_at,
    )


@router.delete("/diseases/{disease_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_disease(disease_id: str, db: Session = Depends(get_db)):
    """Delete a custom disease protocol."""
    d = db.query(DiseaseConfigModel).filter(DiseaseConfigModel.id == disease_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Hastalık protokolü bulunamadı.")
    if not d.is_custom:
        raise HTTPException(status_code=400, detail="Sistem yerleşik hastalık protokolleri silinemez.")
    db.delete(d)
    db.commit()
    return None
