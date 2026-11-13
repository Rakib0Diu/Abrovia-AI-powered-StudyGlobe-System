import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { EmptyState } from './components/UI';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Countries from './pages/Countries';
import Universities from './pages/Universities';
import UniversityDetails from './pages/UniversityDetails';
import Programs from './pages/Programs';
import Scholarships from './pages/Scholarships';
import Admin from './pages/Admin';

function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <EmptyState
        title="Page not found"
        message="The page you are looking for does not exist or may have been moved."
        action={
          <Link
            to="/"
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
          >
            Back to Home
          </Link>
        }
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200">
            <Navbar />
            <main className="min-h-screen flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route path="/countries" element={<Countries />} />
                <Route path="/universities" element={<Universities />} />
                <Route path="/universities/:id" element={<UniversityDetails />} />
                <Route path="/programs" element={<Programs />} />
                <Route path="/scholarships" element={<Scholarships />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-6 text-center text-sm text-slate-500 dark:text-slate-400 transition-colors duration-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                © {new Date().getFullYear()} StudyGlobe — Abrovia: Your AI powered study companion
              </div>
            </footer>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
