import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { HastaPage } from './pages/HastaPage'
import HomePage from './pages/HomePage'
import { PersonelPage } from './pages/PersonelPage'
import { HastaGirisPage } from './pages/HastaGirisPage'
import { PersonelGirisPage } from './pages/PersonelGirisPage'
import { HospitalProvider } from './components/HospitalContext'
import { ClinicalChatbot } from './components/ClinicalChatbot'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HospitalProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/hasta-giris" element={<HastaGirisPage />} />
            <Route path="/personel-giris" element={<PersonelGirisPage />} />
            <Route path="/hasta" element={<HastaPage />} />
            <Route path="/personel" element={<PersonelPage />} />
          </Routes>
          <ClinicalChatbot />
        </BrowserRouter>
      </HospitalProvider>
    </QueryClientProvider>
  )
}
