// src/pages/Login.js
import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [passwordAttempt, setPasswordAttempt] = useState('');

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Área Protegida</h2>
      <div style={{ marginTop: '20px' }}>
        <label>
          Contraseña:
          <input
            type="password"
            value={passwordAttempt}
            onChange={(e) => setPasswordAttempt(e.target.value)}
            style={{ marginLeft: '10px' }}
          />
        </label>
        <div style={{ marginTop: '20px' }}>
          <button onClick={() => onLogin(passwordAttempt)}>Entrar</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
