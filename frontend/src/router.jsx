import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./modules/dashboard/Dashboard";
import MeetingsDashboard from "./modules/dashboard/MeetingsDashboard";
import StudentList from "./modules/students/StudentList";
import TeacherList from "./modules/teachers/TeacherList";
import CourseList from "./modules/courses/CourseList";
import MeetingList from "./modules/meetings/MeetingList";
import JoinMeeting from "./modules/meetings/JoinMeeting";
import Profile from "./modules/profile/Profile";
import Attendance from "./modules/attendance/Attendance";
import Login from "./modules/auth/Login";
import { useAuth } from "./app/authContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layout/AdminLayout";

function RoleDashboard() {
  const { user } = useAuth();
  if (user?.role === "student" || user?.role === "teacher") {
    return <MeetingsDashboard />;
  }
  return <Dashboard />;
}

export default function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />

        {/* Protected Layout Route */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<RoleDashboard />} />
          <Route path="/students" element={<StudentList />} />
          <Route path="/teachers" element={<TeacherList />} />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/meetings" element={<MeetingList />} />
          <Route path="/meetings/join/:meetingId" element={<JoinMeeting />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
