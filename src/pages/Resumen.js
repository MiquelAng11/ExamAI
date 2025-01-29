// src/pages/Resumen.js
import React, { useEffect, useState } from "react";
import { Configuration, OpenAIApi } from "openai";
import { jsPDF } from "jspdf";

function Resumen() {
  const [pptText, setPptText] = useState("");
  const [studyNotes, setStudyNotes] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const userKey = localStorage.getItem("userOpenAIKey");
  const effectiveKey = userKey || process.env.REACT_APP_OPENAI_API_KEY;

  const configuration = new Configuration({ apiKey: effectiveKey });
  const openai = new OpenAIApi(configuration);

  useEffect(() => {
    const dataStr = localStorage.getItem("pptData");
    if (dataStr) {
      const data = JSON.parse(dataStr);
      const combinedText = data.slides.map((sl) => sl.text).join("\n");
      setPptText(combinedText);
    } else {
      setStatusMsg("No se encontró texto parseado (PPT).");
    }
  }, []);

  const generateStudyNotes = async () => {
    if (!pptText) {
      setStatusMsg("No hay texto PPT. Sube/parsea primero.");
      return;
    }
    setIsLoading(true);
    setStudyNotes("");
    setStatusMsg("");

    try {
      const messages = [
        {
          role: "system",
          content: "Eres un asistente que crea apuntes de estudio en español."
        },
        {
          role: "user",
          content: `
Aquí tienes el texto extraído de un PowerPoint:

${pptText}

Por favor, elabora apuntes de estudio detallados en español,
para repasar todo el contenido importante.
No inventes datos ni uses info externa.
        `
        }
      ];

      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.7
      });
      const notes = response.data.choices[0].message.content.trim();
      setStudyNotes(notes);
    } catch (error) {
      console.error("Error generando apuntes PPT:", error);
      setStatusMsg("Error generando apuntes PPT. Ver consola.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!studyNotes) {
      setStatusMsg("No hay apuntes para descargar.");
      return;
    }
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Apuntes de Estudio (PPT)", 40, 60);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(12);

    const lines = doc.splitTextToSize(studyNotes, 500);
    let currentY = 90;
    for (const line of lines) {
      if (currentY > 720) {
        doc.addPage();
        currentY = 60;
      }
      doc.text(line, 40, currentY);
      currentY += 18;
    }
    doc.save("Apuntes-PPT.pdf");
  };

  return (
    <div>
      <h2>Resumen PPT</h2>
      {pptText ? (
        <>
          <p>Genera apuntes de estudio a partir del texto parseado del PowerPoint.</p>
          <button onClick={generateStudyNotes} disabled={isLoading}>
            {isLoading ? "Generando..." : "Generar Apuntes PPT (AI)"}
          </button>
        </>
      ) : (
        <p>No se encontró texto parseado (PPT). Sube y parsea en "Subir".</p>
      )}

      {studyNotes && (
        <div style={{ marginTop: "20px" }}>
          <h3>Apuntes de Estudio (PPT):</h3>
          <pre
            style={{
              backgroundColor: "#f9f9f9",
              padding: "10px",
              maxHeight: "300px",
              overflowY: "auto"
            }}
          >
            {studyNotes}
          </pre>
          <button onClick={downloadPDF}>Descargar PDF</button>
        </div>
      )}

      {statusMsg && <div className="status">{statusMsg}</div>}
    </div>
  );
}

export default Resumen;
