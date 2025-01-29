// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Header from './components/Header';
import Login from './pages/Login';
import Subir from './pages/Subir';
import Examen from './pages/Examen';
import Resumen from './pages/Resumen';
import ResumenPDF from './pages/ResumenPDF';
import Config from './pages/Config';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const sitePassword = process.env.REACT_APP_SITE_PASSWORD || '1234';

  const handleLogin = (attempt) => {
    if (attempt === sitePassword) {
      setIsAuthenticated(true);
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Header />
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/subir" />} />
          <Route path="/subir" element={<Subir />} />
          <Route path="/examen" element={<Examen />} />
          <Route path="/resumen" element={<Resumen />} />
          <Route path="/pdf-resumen" element={<ResumenPDF />} />
          <Route path="/config" element={<Config />} />
          <Route path="*" element={<Navigate to="/subir" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
