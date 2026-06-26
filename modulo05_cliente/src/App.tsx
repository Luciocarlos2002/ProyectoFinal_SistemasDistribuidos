import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import AppLayout from '@/layouts/AppLayout'
import NuevaRentaTab from '@/pages/POS/NuevaRentaTab'
import DevolucionTab from '@/pages/POS/DevolucionTab'
import ConsultaPage from '@/pages/Consulta'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<NuevaRentaTab />} />
          <Route path="/devolucion" element={<DevolucionTab />} />
          <Route path="/consulta" element={<ConsultaPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
