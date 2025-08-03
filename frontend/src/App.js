import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateRoom from './pages/CreateRoom';
import RoomList from './pages/RoomList';
import GameRoom from './pages/GameRoom';
import MyTickets from './pages/MyTickets';
import OrganizerBoard from './pages/OrganizerBoard';

// Protected Route Component
const ProtectedRoute = ({ children, organizerOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (organizerOnly && user.role !== 'organizer' && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Main App Component
const AppContent = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" /> : <Login />
          } />
          <Route path="/register" element={
            user ? <Navigate to="/dashboard" /> : <Register />
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/create-room" element={
            <ProtectedRoute organizerOnly={true}>
              <CreateRoom />
            </ProtectedRoute>
          } />
          <Route path="/rooms" element={
            <ProtectedRoute>
              <RoomList />
            </ProtectedRoute>
          } />
          <Route path="/room/:roomId" element={
            <ProtectedRoute>
              <GameRoom />
            </ProtectedRoute>
          } />
          <Route path="/organizer-board/:roomId" element={
            <ProtectedRoute organizerOnly={true}>
              <OrganizerBoard />
            </ProtectedRoute>
          } />
          <Route path="/my-tickets" element={
            <ProtectedRoute>
              <MyTickets />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;