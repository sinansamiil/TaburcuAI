import { Link } from 'react-router-dom'
import { HealthStatus } from '../components/HealthStatus'

/** Landing / home page. */
export default function HomePage() {
  return (
    <main className="page" id="home-page">
      <div className="container">
        <div
          style={{
            textAlign: 'center',
            maxWidth: '680px',
            margin: '3rem auto',
          }}
        >
          <h1 className="page__title" style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>
            💊 TaburcuAI
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            Kalp yetmezliği taburculuk talimatlarının anlaşılmasını ölçen yapay zeka asistanı.
          </p>

          <div style={{ margin: '1.5rem 0' }}>
            <HealthStatus />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/hasta" className="btn btn--primary" id="cta-hasta">
              Hasta Girişi
            </Link>
            <Link to="/personel" className="btn btn--secondary" id="cta-personel">
              Personel Paneli
            </Link>
          </div>

          <div
            className="card"
            style={{ marginTop: '3rem', textAlign: 'left', lineHeight: 1.9 }}
          >
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Nasıl çalışır?</h2>
            <ol style={{ paddingLeft: '1.3rem', color: 'var(--color-text-muted)' }}>
              <li>Taburculuk özetini sisteme yapıştırın.</li>
              <li>Yapay zeka, ilaçlar ve talimatlar için sade bir plan üretir.</li>
              <li>Anlama soruları cevaplayın.</li>
              <li>Risk raporu hemşire/hekim paneline iletilir.</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  )
}
