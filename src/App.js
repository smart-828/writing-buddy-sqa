import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";

import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudentDetail from "./pages/admin/AdminStudentDetail";
import AdminNewStudent from "./pages/admin/AdminNewStudent";
import AdminPrompts from "./pages/admin/AdminPrompts";
import StudentHome from "./pages/student/StudentHome";
import StudentPromptPicker from "./pages/student/StudentPromptPicker";
import StudentWritingEditor from "./pages/student/StudentWritingEditor";
import StudentFeedback from "./pages/student/StudentFeedback";
import StudentProgress from "./pages/student/StudentProgress";
import { Spinner } from "./components/shared/UI";

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;
  if (!user) return <LoginPage />;
  if (!profile) return <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading profile…</div>;

  if (profile.role === "admin") {
    return (
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/students/new" element={<AdminNewStudent />} />
        <Route path="/admin/students/:studentId" element={<AdminStudentDetail />} />
        <Route path="/admin/prompts" element={<AdminPrompts />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/student" element={<StudentHome />} />
      <Route path="/student/prompts/:type" element={<StudentPromptPicker />} />
      <Route path="/student/write/:promptId" element={<StudentWritingEditor />} />
      <Route path="/student/feedback/:submissionId" element={<StudentFeedback />} />
      <Route path="/student/progress" element={<StudentProgress />} />
      <Route path="*" element={<Navigate to="/student" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
