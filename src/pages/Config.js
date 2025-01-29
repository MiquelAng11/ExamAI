// src/pages/Config.js
import React, { useState, useEffect } from 'react';

function Config() {
  const [apiKey, setApiKey] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('userOpenAIKey');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSaveKey = () => {
    localStorage.setItem('userOpenAIKey', apiKey.trim());
    setStatusMsg('API Key guardada en localStorage.userOpenAIKey.');
  };

  const handleClearKey = () => {
    localStorage.removeItem('userOpenAIKey');
    setApiKey('');
    setStatusMsg('Se ha borrado la API Key de localStorage.');
  };

  return (
    <div>
      <h2>Configurar API Key de OpenAI</h2>
      <p>
        Ingresa tu clave de OpenAI (formato <code>sk-...</code>) para que la app la use.
        Si no se especifica, tratará de usar la de <code>.env</code> (si existe).
      </p>

      <label style={{ display: 'block', marginBottom: 8 }}>
        OpenAI API Key:
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{ width: '100%', marginTop: '5px' }}
        />
      </label>

      <button onClick={handleSaveKey} style={{ marginRight: '10px' }}>
        Guardar
      </button>
      <button onClick={handleClearKey}>
        Borrar Key
      </button>

      {statusMsg && <div className="status">{statusMsg}</div>}
    </div>
  );
}

export default Config;
