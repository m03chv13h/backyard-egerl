import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import EventListPage from './pages/EventListPage';
import CreateEventPage from './pages/CreateEventPage';
import EventDetailPage from './pages/EventDetailPage';
import RunnerPage from './pages/RunnerPage';
import TagInfoPage from './pages/TagInfoPage';
import ScannerStatusPage from './pages/ScannerStatusPage';
import ForbiddenPage from './pages/ForbiddenPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forbidden" element={<ForbiddenPage />} />
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <EventListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/new"
                element={
                  <ProtectedRoute adminOnly>
                    <CreateEventPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute>
                    <EventDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/runner/:runnerId"
                element={
                  <ProtectedRoute>
                    <RunnerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tag-info"
                element={
                  <ProtectedRoute adminOnly>
                    <TagInfoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scanner"
                element={
                  <ProtectedRoute adminOnly>
                    <ScannerStatusPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/events" replace />} />
              <Route path="*" element={<Navigate to="/events" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
