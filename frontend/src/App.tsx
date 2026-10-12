import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import HastaPage from './pages/HastaPage'
import HomePage from './pages/HomePage'
import PersonelPage from './pages/PersonelPage'

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
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/hasta" element={<HastaPage />} />
          <Route path="/personel" element={<PersonelPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
