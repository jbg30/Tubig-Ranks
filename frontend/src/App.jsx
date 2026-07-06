import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import Queue from './pages/Queue';
import Match from './pages/Match';
import Ranks from './pages/Ranks';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Tournament from './pages/Tournament';
import TournamentHistory from './pages/TournamentHistory';
import TournamentLeaderboard from './pages/TournamentLeaderboard';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
      <Route path="/queue" element={<ProtectedRoute><Queue /></ProtectedRoute>} />
      <Route path="/match/:id" element={<ProtectedRoute><Match /></ProtectedRoute>} />
      <Route path="/ranks" element={<ProtectedRoute><Ranks /></ProtectedRoute>} />
      <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/tournament" element={<ProtectedRoute><Tournament /></ProtectedRoute>} />
      <Route path="/tournament/:id" element={<ProtectedRoute><Tournament /></ProtectedRoute>} />
      <Route path="/tournaments" element={<ProtectedRoute><TournamentHistory /></ProtectedRoute>} />
      <Route path="/tournament-leaderboard" element={<ProtectedRoute><TournamentLeaderboard /></ProtectedRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}

export default App;