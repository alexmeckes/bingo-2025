import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthProvider';

import AuthForm from './components/AuthForm';
import CreateGroup from './components/CreateGroup';
import JoinGroup from './components/JoinGroup';
import GroupDashboard from './components/GroupDashboard';
import SubmitPrediction from './components/SubmitPrediction';
import ReviewPredictions from './components/ReviewPredictions';
import BingoCard from './components/BingoCard';

function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/auth" />;
}

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/auth" element={!user ? <AuthForm /> : <Navigate to="/" />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <CreateGroup />
        </PrivateRoute>
      } />
      
      <Route path="/join/:groupId" element={<JoinGroup />} />
      
      <Route path="/group/:groupId" element={
        <PrivateRoute>
          <GroupDashboard />
        </PrivateRoute>
      } />
      
      <Route path="/group/:groupId/submit" element={
        <PrivateRoute>
          <SubmitPrediction />
        </PrivateRoute>
      } />
      
      <Route path="/group/:groupId/review" element={
        <PrivateRoute>
          <ReviewPredictions />
        </PrivateRoute>
      } />
      
      <Route path="/group/:groupId/card" element={
        <PrivateRoute>
          <BingoCard />
        </PrivateRoute>
      } />
    </Routes>
  );
}

export default App; 