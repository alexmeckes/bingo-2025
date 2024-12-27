import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import CreateGroup from './components/CreateGroup';
import GroupDashboard from './components/GroupDashboard';
import JoinGroup from './components/JoinGroup';
import SubmitPrediction from './components/SubmitPrediction';
import BingoCard from './components/BingoCard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<CreateGroup />} />
          <Route path="/join/:groupId" element={<JoinGroup />} />
          <Route path="/group/:groupId" element={<GroupDashboard />} />
          <Route path="/group/:groupId/submit" element={<SubmitPrediction />} />
          <Route path="/group/:groupId/card" element={<BingoCard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App; 