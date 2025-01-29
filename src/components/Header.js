// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header>
      <nav className="header-links">
        <Link to="/subir">Subir</Link>
        <Link to="/examen">Examen</Link>
        <Link to="/resumen">Resumen PPT</Link>
        <Link to="/pdf-resumen">Resumen PDF</Link>
        <Link to="/config">Configurar API Key</Link>
      </nav>
    </header>
  );
};

export default Header;
