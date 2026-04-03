import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import Login from './pages/Login'
import FieldOpsDashboard from './pages/FieldOpsDashboard'
import DailySiteReportWizard from './pages/DailySiteReportWizard'
import DailySiteReportView from './pages/DailySiteReportView'
import ReportsArchive from './pages/ReportsArchive'
import AddSite from './pages/AddSite'
import DailyLog from './pages/DailyLog'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* New Report is accessible without login */}
          <Route path="/daily-reports/new" element={<DailySiteReportWizard />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/daily-reports" replace />} />
            <Route path="/daily-reports" element={<FieldOpsDashboard />} />
            <Route path="/reports" element={<ReportsArchive />} />
            <Route path="/sites/new" element={<AddSite />} />
            <Route path="/daily-log" element={<DailyLog />} />
            <Route path="/daily-reports/:id" element={<DailySiteReportView />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/daily-reports" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
