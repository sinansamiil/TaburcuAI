"""Database initialization and default seeding for TaburcuAI."""

from sqlalchemy.orm import Session
from app.db.models import (
    DoctorModel,
    NurseModel,
    PatientModel,
    HospitalConfigModel,
    DiseaseConfigModel,
    CaseModel,
    CaseWorkflowModel,
)


def seed_default_data(db: Session) -> None:
    """Ensure initial hospital config, staff, patients, and diseases exist."""

    # 1. Hospital Config
    hospital = db.query(HospitalConfigModel).first()
    if not hospital:
        default_hospital = HospitalConfigModel(
            id="default",
            hospital_name="Şehir Eğitim ve Araştırma Hastanesi",
            hospital_subtitle="Akıllı Taburculuk ve Klinik Takip Sistemi",
            logo_icon="building-2",
            logo_url=None,
            primary_color="#1e5ba3",
            accent_color="#0284c7",
            phone="+90 (212) 444 00 00",
            emergency_phone="112 Acil Çağrı",
            address="Merkez Kampüs Sağlık Caddesi No:1, İstanbul",
            email="taburcu@hastane.gov.tr",
            active_departments=[
                "Nefroloji Kliniği",
                "Kardiyoloji Kliniği",
                "Dahiliye (İç Hastalıkları)",
                "Endokrinoloji & Diyabet",
                "Göğüs Hastalıkları",
            ],
            custom_disclaimer=(
                "Bu sistem, hekiminizin düzenlediği epikriz ve taburculuk talimatlarının hasta tarafından "
                "en doğru şekilde anlaşılmasını desteklemek amacıyla geliştirilmiştir."
            ),
        )
        db.add(default_hospital)

    # 2. Doctors
    if db.query(DoctorModel).count() == 0:
        doctors = [
            DoctorModel(
                name="Prof. Dr. Deniz Aksoy",
                title="Klinik Şefi & Nefroloji Uzmanı",
                specialty="Nefroloji",
                email="deniz.aksoy@hastane.gov.tr",
                phone="0212 444 10 11",
                room="Poliklinik B-204",
            ),
            DoctorModel(
                name="Doç. Dr. Michael Carter",
                title="Kardiyoloji Uzmanı",
                specialty="Kardiyoloji",
                email="m.carter@hastane.gov.tr",
                phone="0212 444 10 12",
                room="Kalp Merkezi A-102",
            ),
            DoctorModel(
                name="Uzm. Dr. Zeynep Yılmaz",
                title="Endokrinoloji ve Metabolizma Uzmanı",
                specialty="Endokrinoloji",
                email="zeynep.yilmaz@hastane.gov.tr",
                phone="0212 444 10 13",
                room="Poliklinik C-110",
            ),
            DoctorModel(
                name="Uzm. Dr. Kerem Bulut",
                title="Göğüs Hastalıkları Uzmanı",
                specialty="Göğüs Hastalıkları",
                email="kerem.bulut@hastane.gov.tr",
                phone="0212 444 10 14",
                room="Solunum Merkezi D-301",
            ),
        ]
        db.add_all(doctors)

    # 3. Nurses
    if db.query(NurseModel).count() == 0:
        nurses = [
            NurseModel(
                name="Hemşire Elif Kaya",
                title="Diyaliz & Nefroloji Sorumlu Hemşiresi",
                ward="Nefroloji Servisi",
                shift="Gündüz (08:00 - 16:00)",
                phone="0532 111 22 33",
            ),
            NurseModel(
                name="Hemşire Mehmet Demir",
                title="Kardiyovasküler Klinik Hemşiresi",
                ward="Kardiyoloji Servisi",
                shift="Gündüz (08:00 - 16:00)",
                phone="0533 222 33 44",
            ),
            NurseModel(
                name="Hemşire Seda Öztürk",
                title="Diyabet & Dahiliye Eğitim Hemşiresi",
                ward="Dahiliye Kliniği",
                shift="Nöbetçi (16:00 - 08:00)",
                phone="0535 333 44 55",
            ),
            NurseModel(
                name="Hemşire Canan Arslan",
                title="Göğüs Hastalıkları Servis Hemşiresi",
                ward="Göğüs Hastalıkları Servisi",
                shift="Gündüz (08:00 - 16:00)",
                phone="0536 444 55 66",
            ),
        ]
        db.add_all(nurses)

    # 4. Patients
    if db.query(PatientModel).count() == 0:
        patients = [
            PatientModel(
                protocol_no="PRT-2026-1042",
                tc_kimlik="28491823746",
                name="Ahmet Yılmaz",
                age=64,
                phone="0532 555 10 42",
                ward="Nefroloji Servisi",
                assigned_doctor="Prof. Dr. Deniz Aksoy",
                primary_disease="kidney_failure",
                notes="Evre 4 KBY, kreatinin takipli. Geçmişte HFrEF öyküsü de mevcut.",
            ),
            PatientModel(
                protocol_no="PRT-2026-2015",
                tc_kimlik="49182736451",
                name="Fatma Çelik",
                age=58,
                phone="0542 666 20 15",
                ward="Kardiyoloji Servisi",
                assigned_doctor="Doç. Dr. Michael Carter",
                primary_disease="heart_failure",
                notes="HFrEF, EF %30, kilo takibi ve tuz kısıtı kritik.",
            ),
            PatientModel(
                protocol_no="PRT-2026-3088",
                tc_kimlik="10293847562",
                name="Mehmet Özkan",
                age=67,
                phone="0555 777 30 88",
                ward="Dahiliye Kliniği",
                assigned_doctor="Uzm. Dr. Zeynep Yılmaz",
                primary_disease="diabetes_type2",
                notes="Tip 2 Diyabet, insülin tedavisi başlangıcı, hipoglisemi farkındalığı gerekiyor.",
            ),
            PatientModel(
                protocol_no="PRT-2026-4190",
                tc_kimlik="39485726103",
                name="Ayşe Aydın",
                age=71,
                phone="0505 888 41 90",
                ward="Göğüs Hastalıkları Servisi",
                assigned_doctor="Uzm. Dr. Kerem Bulut",
                primary_disease="copd_respiratory",
                notes="KOAH GOLD Evre 3, üçlü inhaler tedavisi ve oksijen takibi.",
            ),
        ]
        db.add_all(patients)

    db.commit()
