import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { FlowProvider } from './context/FlowContext.jsx';
import AppShell from './components/AppShell.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewEstimate from './pages/NewEstimate.jsx';
import Jobs from './pages/Jobs.jsx';
import JobDetail from './pages/JobDetail.jsx';
import Customers from './pages/Customers.jsx';
import Commissions from './pages/Commissions.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <AuthProvider>
      <FlowProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/estimates/new" element={<Protected><NewEstimate /></Protected>} />
          <Route path="/estimates/:id" element={<Protected><NewEstimate /></Protected>} />
          <Route path="/jobs" element={<Protected><Jobs /></Protected>} />
          <Route path="/jobs/:id" element={<Protected><JobDetail /></Protected>} />
          <Route path="/customers" element={<Protected><Customers /></Protected>} />
          <Route path="/commissions" element={<Protected><Commissions /></Protected>} />
          <Route path="/reports" element={<Protected><Reports /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </FlowProvider>
    </AuthProvider>
  );
}
