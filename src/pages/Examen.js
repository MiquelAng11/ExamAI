// src/pages/Examen.js
import React, { useState, useEffect } from "react";
import { Configuration, OpenAIApi } from "openai";

function Examen() {
  const [pptText, setPptText] = useState("");
  const [numQuestions, setNumQuestions] = useState(3);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [explanations, setExplanations] = useState({});

  // On mount, load PPT text by default
  useEffect(() => {
    loadPptData();
  }, []);

  // For custom key
  const userKey = localStorage.getItem('userOpenAIKey');
  const effectiveKey = userKey || process.env.REACT_APP_OPENAI_API_KEY;

  const configuration = new Configuration({ apiKey: effectiveKey });
  const openai = new OpenAIApi(configuration);

  // Load PPT text from localStorage
  const loadPptData = () => {
    const dataStr = localStorage.getItem("pptData");
    if (dataStr) {
      const data = JSON.parse(dataStr);
      const combined = data.slides.map(sl => sl.text).join("\n");
      setPptText(combined);
      alert("Texto cargado desde PPT");
    } else {
      alert("No hay PPT parseado en localStorage.");
    }
  };

  // Load PDF text from localStorage
  const loadPdfData = () => {
    const dataStr = localStorage.getItem("pdfData");
    if (dataStr) {
      const data = JSON.parse(dataStr);
      // data.docs -> array of { originFile, text }
      const combined = data.docs.map(d => d.text).join("\n");
      setPptText(combined);
      alert("Texto cargado desde PDF");
    } else {
      alert("No hay PDF parseado en localStorage.");
    }
  };

  const parseQuestions = (text) => {
    return text
      .split("\n")
      .map(line => line.trim().replace(/^[-\d.)]+\s*/, ""))
      .filter(line => line.length > 0);
  };

  const generateQuestions = async () => {
    if (!pptText) {
      alert("No hay texto cargado (PPT o PDF).");
      return;
    }
    setQuestions([]);
    setAnswers({});
    setExplanations({});

    try {
      const messages = [
        {
          role: "system",
          content: "Eres un asistente que responde en español usando SOLO el texto provisto.",
        },
        {
          role: "user",
          content: `
Texto:
${pptText}

Genera ${numQuestions} preguntas de examen abiertas (sin opciones) en español,
basadas únicamente en el texto anterior.
NO enumeres ni listes las preguntas (sin '1.', '2.', etc.).
        `,
        },
      ];

      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
      });

      const reply = response.data.choices[0].message.content.trim();
      const qArray = parseQuestions(reply);
      setQuestions(qArray);
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Error generando preguntas. Ver consola.");
    }
  };

  const handleAnswerChange = (index, val) => {
    setAnswers(prev => ({ ...prev, [index]: val }));
  };

  const handleCorrect = async (index) => {
    const question = questions[index];
    const studentAnswer = answers[index] || "";

    if (!question || !studentAnswer) {
      alert("Falta pregunta o respuesta.");
      return;
    }

    try {
      const messages = [
        {
          role: "system",
          content: "Eres un asistente que verifica la respuesta usando SOLO el texto provisto.",
        },
        {
          role: "user",
          content: `
Texto:
${pptText}

Pregunta:
${question}

Respuesta del estudiante:
${studentAnswer}

Basándote EXCLUSIVAMENTE en el texto,
indica si la respuesta es correcta o qué está mal, y cómo mejorarla.
        `,
        },
      ];

      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
      });

      const correction = response.data.choices[0].message.content.trim();
      setExplanations(prev => ({ ...prev, [index]: correction }));
    } catch (error) {
      console.error("Error corrigiendo:", error);
      alert("Error corrigiendo respuesta. Ver consola.");
    }
  };

  return (
    <div>
      <h2>Examen</h2>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={loadPptData} style={{ marginRight: '10px' }}>
          Usar PPT Data
        </button>
        <button onClick={loadPdfData}>
          Usar PDF Data
        </button>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ marginRight: 10 }}>
          Número de Preguntas:
          <input
            type="number"
            min="1"
            max="20"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            style={{ marginLeft: 10, width: 60 }}
          />
        </label>
        <button onClick={generateQuestions}>Generar Preguntas</button>
      </div>

      {questions.map((q, i) => (
        <div
          key={i}
          style={{
            marginBottom: 20,
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 5,
          }}
        >
          <p><strong>Pregunta {i + 1}:</strong> {q}</p>
          <textarea
            rows={4}
            placeholder="Tu respuesta..."
            value={answers[i] || ""}
            onChange={(e) => handleAnswerChange(i, e.target.value)}
            style={{ width: "100%", marginBottom: "10px" }}
          />
          <div>
            <button onClick={() => handleCorrect(i)}>Corregir</button>
          </div>
          {explanations[i] && (
            <div style={{ background: "#f9f9f9", padding: 10, marginTop: 10 }}>
              <strong>Corrección / Explicación:</strong>
              <p>{explanations[i]}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Examen;
