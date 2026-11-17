import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  BarChart3, CalendarCheck, CalendarClock, CalendarPlus, ClipboardList, FileText, History, LayoutDashboard, MessageCircle, Stethoscope, UserRound, Users,
} from 'lucide-react'
import { StoreProvider, useStore } from './lib/store'
import { ToastProvider } from './components/toast'
import PublicLayout from './components/PublicLayout'
import RequireRole from './components/RequireRole'
import DashboardLayout, { type NavItem } from './components/DashboardLayout'
import ConsultationRoom from './components/ConsultationRoom'
import Home from './pages/public/Home'
import ServiceDetail from './pages/public/ServiceDetail'
import Doctors from './pages/public/Doctors'
import DoctorProfile from './pages/public/DoctorProfile'
import { ArticleDetail, Articles } from './pages/public/Articles'
import NotFound from './pages/public/NotFound'
import { Forgot, Login, Register, ResetPassword } from './pages/auth/Auth'
import PatientDashboard from './pages/patient/PatientDashboard'
import OnlineConsult from './pages/patient/OnlineConsult'
import ConsultationHistory from './pages/patient/ConsultationHistory'
import BookAppointment from './pages/patient/BookAppointment'
import AppointmentHistory from './pages/patient/AppointmentHistory'
import PatientProfile from './pages/patient/PatientProfile'
import { DoctorDashboard, DoctorHistory, DoctorPatients, DoctorRequests, DoctorSchedule } from './pages/doctor/DoctorPages'
import { AdminAppointments, AdminContent, AdminDoctors, AdminOverview, AdminPatients, AdminReports } from './pages/admin/AdminPages'

const patientNav: NavItem[] = [
  { to: '/pasien', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pasien/konsultasi', label: 'Konsultasi Online', icon: MessageCircle },
  { to: '/pasien/janji-temu/baru', label: 'Buat Janji Offline', icon: CalendarPlus },
  { to: '/pasien/janji-temu', label: 'Riwayat Janji Temu', icon: CalendarCheck, end: true },
  { to: '/pasien/riwayat-konsultasi', label: 'Riwayat Konsultasi', icon: History },
  { to: '/pasien/profil', label: 'Profil Saya', icon: UserRound },
]

function PatientShell() {
  return <DashboardLayout items={patientNav} roleLabel="Portal Pasien" />
}

function DoctorShell() {
  const { appointments, consultations, user } = useStore()
  const id = user?.doctorId
  const pending = appointments.filter((a) => a.doctorId === id && a.status === 'Menunggu Konfirmasi').length + consultations.filter((c) => c.doctorId === id && c.status === 'Menunggu').length
  const items: NavItem[] = [
    { to: '/portal-dokter', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/portal-dokter/permintaan', label: 'Permintaan & Janji', icon: ClipboardList, badge: pending },
    { to: '/portal-dokter/jadwal', label: 'Jadwal Praktik', icon: CalendarClock },
    { to: '/portal-dokter/pasien', label: 'Pasien Saya', icon: Users },
    { to: '/portal-dokter/riwayat', label: 'Riwayat', icon: History },
  ]
  return <DashboardLayout items={items} roleLabel="Portal Dokter" />
}

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Ringkasan', icon: LayoutDashboard, end: true },
  { to: '/admin/dokter', label: 'Dokter', icon: Stethoscope },
  { to: '/admin/pasien', label: 'Pasien', icon: Users },
  { to: '/admin/janji-temu', label: 'Janji Temu', icon: CalendarCheck },
  { to: '/admin/konten', label: 'Konten', icon: FileText },
  { to: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
]

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <StoreProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="layanan/:slug" element={<ServiceDetail />} />
              <Route path="dokter" element={<Doctors />} />
              <Route path="dokter/:id" element={<DoctorProfile />} />
              <Route path="artikel" element={<Articles />} />
              <Route path="artikel/:slug" element={<ArticleDetail />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="/masuk" element={<Login />} />
            <Route path="/daftar" element={<Register />} />
            <Route path="/lupa-password" element={<Forgot />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            <Route path="/pasien" element={<RequireRole role="patient" />}>
              <Route element={<PatientShell />}>
                <Route index element={<PatientDashboard />} />
                <Route path="konsultasi" element={<OnlineConsult />} />
                <Route path="konsultasi/:id" element={<ConsultationRoom backTo="/pasien/riwayat-konsultasi" />} />
                <Route path="riwayat-konsultasi" element={<ConsultationHistory />} />
                <Route path="janji-temu" element={<AppointmentHistory />} />
                <Route path="janji-temu/baru" element={<BookAppointment />} />
                <Route path="profil" element={<PatientProfile />} />
              </Route>
            </Route>

            <Route path="/portal-dokter" element={<RequireRole role="doctor" />}>
              <Route element={<DoctorShell />}>
                <Route index element={<DoctorDashboard />} />
                <Route path="permintaan" element={<DoctorRequests />} />
                <Route path="jadwal" element={<DoctorSchedule />} />
                <Route path="pasien" element={<DoctorPatients />} />
                <Route path="riwayat" element={<DoctorHistory />} />
                <Route path="konsultasi/:id" element={<ConsultationRoom backTo="/portal-dokter/permintaan" />} />
              </Route>
            </Route>

            <Route path="/admin" element={<RequireRole role="admin" />}>
              <Route element={<DashboardLayout items={adminNav} roleLabel="Administrator" />}>
                <Route index element={<AdminOverview />} />
                <Route path="dokter" element={<AdminDoctors />} />
                <Route path="pasien" element={<AdminPatients />} />
                <Route path="janji-temu" element={<AdminAppointments />} />
                <Route path="konten" element={<AdminContent />} />
                <Route path="laporan" element={<AdminReports />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
            </Route>
          </Routes>
        </StoreProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
