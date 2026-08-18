import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import PageLoader from '../components/PageLoader';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import { ROLES } from '../utils/constants';

const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Profile = lazy(() => import('../pages/Profile'));
const NotFound = lazy(() => import('../pages/NotFound'));
const AdminManagement = lazy(() => import('../pages/SuperAdmin/AdminManagement'));
const Performance = lazy(() => import('../pages/SuperAdmin/Performance'));
const Patients = lazy(() => import('../pages/shared/Patients'));
const Conferences = lazy(() => import('../pages/shared/Conferences'));
const ConferenceRoom = lazy(() => import('../pages/shared/ConferenceRoom'));
const Tasks = lazy(() => import('../pages/shared/Tasks'));
const Appointments = lazy(() => import('../pages/shared/Appointments'));
const AppointmentFilePreview = lazy(() => import('../pages/shared/AppointmentFilePreview'));
const Reports = lazy(() => import('../pages/shared/Reports'));
const Settings = lazy(() => import('../pages/shared/Settings'));
const Preferences = lazy(() => import('../pages/shared/Preferences'));
const AuditLogs = lazy(() => import('../pages/shared/AuditLogs'));
const Notifications = lazy(() => import('../pages/shared/Notifications'));
const MedicalNotes = lazy(() => import('../pages/GP/MedicalNotes'));
const PatientReports = lazy(() => import('../pages/AHP/PatientReports'));
const JoinTimeReport = lazy(() => import('../pages/shared/JoinTimeReport'));
const GuestConferenceLogin = lazy(() => import('../pages/GuestConferenceLogin'));
const ConferenceDocumentPreview = lazy(() => import('../pages/shared/ConferenceDocumentPreview'));

const Receptionists = lazy(() =>
  import('../pages/shared/StaffManagement').then((m) => ({ default: m.Receptionists }))
);
const GPs = lazy(() =>
  import('../pages/shared/StaffManagement').then((m) => ({ default: m.GPs }))
);
const AHPs = lazy(() =>
  import('../pages/shared/StaffManagement').then((m) => ({ default: m.AHPs }))
);

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/guest-conference" element={<GuestConferenceLogin />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />

          <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
            <Route path="/admins" element={<AdminManagement />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
            <Route path="/performance" element={<Performance />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]} />}>
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route path="/receptionists" element={<Receptionists />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.RECEPTIONIST]} />}>
            <Route path="/preferences" element={<Preferences />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.SUPER_ADMIN, ROLES.GP, ROLES.AHP]} />}>
            <Route path="/patients" element={<Patients />} />
            <Route path="/gps" element={<GPs />} />
            <Route path="/ahps" element={<AHPs />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.RECEPTIONIST, ROLES.GP, ROLES.AHP, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.CONFERENCE_GUEST]} />}>
            <Route path="/conferences" element={<Conferences />} />
            <Route path="/conferences/:id/room" element={<ConferenceRoom />} />
            <Route path="/conferences/:conferenceId/documents/:fileId/preview" element={<ConferenceDocumentPreview />} />
            <Route path="/tasks" element={<Tasks />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.RECEPTIONIST, ROLES.ADMIN]} />}>
            <Route path="/join-time-report" element={<JoinTimeReport />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.RECEPTIONIST]} />}>
            <Route path="/appointments" element={<Appointments />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.GP]} />}>
            <Route path="/medical-notes" element={<MedicalNotes />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.AHP]} />}>
            <Route path="/patient-reports" element={<PatientReports />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.RECEPTIONIST]} />}>
          <Route path="/appointments/:appointmentId/files/:fileId/preview" element={<AppointmentFilePreview />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
