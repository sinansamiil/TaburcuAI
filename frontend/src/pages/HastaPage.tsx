/** Hasta (Patient) page – Phase 0 scaffold. */
export default function HastaPage() {
  return (
    <main className="page" id="hasta-page">
      <div className="container">
        <h1 className="page__title">Taburculuk Planınız</h1>
        <p className="page__subtitle">
          Taburculuk özetinizi yapıştırın ve kişiselleştirilmiş planınızı görün.
        </p>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            🚧 Bu sayfa Faz 3'te tamamlanacak.
          </p>
        </div>

        {/* Clinical safety disclaimer – always visible */}
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '1rem',
            marginTop: '2rem',
          }}
        >
          Bu bilgi hekiminizin yazdığı talimatın sadeleştirilmiş halidir; sorunuz varsa
          hekiminize danışın.
        </p>
      </div>
    </main>
  )
}
