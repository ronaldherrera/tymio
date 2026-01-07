
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import ProfileScreen from './components/ProfileScreen';
import HistoryScreen from './components/HistoryScreen';

export const AppContext = React.createContext<{
  user: any;
  setUser: (u: any) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (b: boolean) => void;
}>({
  user: null,
  setUser: () => {},
  isLoggedIn: false,
  setIsLoggedIn: () => {}
});

const App: React.FC = () => {
  const [user, setUser] = useState({
    name: "Carlos Rodriguez",
    role: "Desarrollador Senior",
    id: "EMP-8439",
    email: "carlos.r@empresa.com",
    dept: "Ingeniería"
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <AppContext.Provider value={{ user, setUser, isLoggedIn, setIsLoggedIn }}>
      <HashRouter>
        <Routes>
          <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" /> : <LoginScreen />} />
          <Route path="/dashboard" element={isLoggedIn ? <DashboardScreen /> : <Navigate to="/" />} />
          <Route path="/profile" element={isLoggedIn ? <ProfileScreen /> : <Navigate to="/" />} />
          <Route path="/history" element={isLoggedIn ? <HistoryScreen /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
