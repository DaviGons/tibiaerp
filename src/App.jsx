import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CharacterProvider } from './contexts/CharacterContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import HuntLog from './pages/HuntLog'
import Historico from './pages/Historico'
import Ferramentas from './pages/Ferramentas'
import Configuracoes from './pages/Configuracoes'

export default function App() {
  return (
    <AuthProvider>
      <CharacterProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/hunt-log" element={<HuntLog />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/ferramentas" element={<Ferramentas />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CharacterProvider>
    </AuthProvider>
  )
}
