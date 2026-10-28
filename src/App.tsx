import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider } from '@/auth/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from '@/components/layout/RequireAuth'
import ComingSoonPage from '@/pages/ComingSoonPage'
import NewMeetingPage from '@/pages/NewMeetingPage'
import MeetingsPage from '@/pages/MeetingsPage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import RegisterPage from '@/pages/RegisterPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                {/* ComingSoonPage entries are replaced by the real screens (S5, S6, S12 ...). */}
                <Route path="/dashboard" element={<ComingSoonPage title="Dashboard" />} />
                <Route path="/meetings" element={<MeetingsPage />} />
                <Route path="/meetings/new" element={<NewMeetingPage />} />
                <Route path="/meetings/:id" element={<ComingSoonPage title="Meeting detail" />} />
                <Route path="/meetings/:id/edit" element={<ComingSoonPage title="Edit meeting" />} />
                <Route path="/tracker" element={<ComingSoonPage title="Action Tracker" />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
