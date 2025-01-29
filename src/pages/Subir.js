// src/pages/Subir.js
import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { db } from '../db';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/* PPTX parse */
async function parsePptx(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideNames = Object.keys(zip.files)
    .filter((fn) => fn.startsWith('ppt/slides/slide') && fn.endsWith('.xml'));

  slideNames.sort((a, b) => {
    const aNum = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0', 10);
    const bNum = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0', 10);
    return aNum - bNum;
  });

  const slides = [];
  for (const filename of slideNames) {
    const xmlStr = await zip.file(filename).async('string');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
    const textNodes = xmlDoc.getElementsByTagName('a:t');
    let slideText = '';
    for (const node of textNodes) {
      slideText += node.textContent + ' ';
    }
    slides.push({
      filename,
      text: slideText.trim(),
    });
  }
  return slides;
}

/* PDF parse */
async function parsePdf(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let combined = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((it) => it.str).join(' ');
    combined += pageText + '\n';
  }
  return combined.trim();
}

export default function Subir() {
  const [pptList, setPptList] = useState([]);
  const [pdfList, setPdfList] = useState([]);

  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    loadPpts();
    loadPdfs();
  }, []);

  async function loadPpts() {
    const all = await db.ppts.toArray();
    setPptList(all);
  }
  async function loadPdfs() {
    const all = await db.pdfs.toArray();
    setPdfList(all);
  }

  async function clearPpts() {
    await db.ppts.clear();
    setPptList([]);
    localStorage.removeItem('pptData');
    setStatusMsg('PPTX limpiados correctamente.');
  }
  async function clearPdfs() {
    await db.pdfs.clear();
    setPdfList([]);
    localStorage.removeItem('pdfData');
    setStatusMsg('PDF limpiados correctamente.');
  }

  const readFileAsUint8 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result));
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // PPTX
  async function handlePptxUpload(fileList) {
    if (!fileList.length) return;
    try {
      for (const file of fileList) {
        const data = await readFileAsUint8(file);
        await db.ppts.add({
          name: file.name,
          size: file.size,
          type: file.type,
          data,
        });
      }
      await loadPpts();
      setStatusMsg(`${fileList.length} PPTX subido(s) correctamente.`);
    } catch (err) {
      console.error('Error al subir PPTX:', err);
      setStatusMsg('Error subiendo PPTX. Revisa la consola.');
    }
  }

  async function parseAllPptx() {
    try {
      const all = await db.ppts.toArray();
      if (!all.length) {
        setStatusMsg('No hay PPTX para parsear.');
        return;
      }
      let allSlides = [];
      for (const record of all) {
        const buf = record.data.buffer;
        const slides = await parsePptx(buf);
        const labeled = slides.map(s => ({ ...s, originFile: record.name }));
        allSlides = [...allSlides, ...labeled];
      }
      localStorage.setItem('pptData', JSON.stringify({ slides: allSlides }));
      setStatusMsg('¡Parse PPTX exitoso! Revisa localStorage.pptData');
    } catch (err) {
      console.error('Error parseando PPTX:', err);
      setStatusMsg('Error parseando PPTX. Ver consola.');
    }
  }

  const handlePptxInput = async (e) => {
    await handlePptxUpload(e.target.files);
    e.target.value = null;
  };
  const handlePptxDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handlePptxDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await handlePptxUpload(e.dataTransfer.files);
  };

  // PDF
  async function handlePdfUpload(fileList) {
    if (!fileList.length) return;
    try {
      for (const file of fileList) {
        const data = await readFileAsUint8(file);
        await db.pdfs.add({
          name: file.name,
          size: file.size,
          type: file.type,
          data,
        });
      }
      await loadPdfs();
      setStatusMsg(`${fileList.length} PDF subido(s) correctamente.`);
    } catch (err) {
      console.error('Error al subir PDF:', err);
      setStatusMsg('Error subiendo PDF. Revisa la consola.');
    }
  }

  async function parseAllPdfs() {
    try {
      const all = await db.pdfs.toArray();
      if (!all.length) {
        setStatusMsg('No hay PDF para parsear.');
        return;
      }
      let docs = [];
      for (const record of all) {
        const buf = record.data.buffer;
        const text = await parsePdf(buf);
        docs.push({ originFile: record.name, text });
      }
      localStorage.setItem('pdfData', JSON.stringify({ docs }));
      setStatusMsg('¡Parse PDF exitoso! Revisa localStorage.pdfData');
    } catch (err) {
      console.error('Error parseando PDF:', err);
      setStatusMsg('Error parseando PDF. Ver consola.');
    }
  }

  const handlePdfInput = async (e) => {
    await handlePdfUpload(e.target.files);
    e.target.value = null;
  };
  const handlePdfDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handlePdfDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await handlePdfUpload(e.dataTransfer.files);
  };

  return (
    <div>
      <h2>Subir Archivos</h2>
      <p>IndexedDB se usa para evitar problemas de cuota de localStorage.</p>

      <div className="section">
        <h3>PPTX</h3>
        <div className="dropzone" onDragOver={handlePptxDragOver} onDrop={handlePptxDrop}>
          Arrastra .pptx aquí
        </div>
        <input
          type="file"
          accept=".pptx"
          multiple
          onChange={handlePptxInput}
          style={{ marginBottom: '10px' }}
        />
        <div>
          <button onClick={parseAllPptx} style={{ marginRight: '10px' }}>
            Parsear todos los PPTX
          </button>
          <button onClick={clearPpts}>Limpiar PPTX</button>
        </div>
        {pptList.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <strong>PPTX en IndexedDB:</strong>
            <ul>
              {pptList.map((p) => (
                <li key={p.id}>
                  {p.name} ({(p.size / 1024).toFixed(1)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="section">
        <h3>PDF</h3>
        <div className="dropzone" onDragOver={handlePdfDragOver} onDrop={handlePdfDrop}>
          Arrastra .pdf aquí
        </div>
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={handlePdfInput}
          style={{ marginBottom: '10px' }}
        />
        <div>
          <button onClick={parseAllPdfs} style={{ marginRight: '10px' }}>
            Parsear todos los PDF
          </button>
          <button onClick={clearPdfs}>Limpiar PDF</button>
        </div>
        {pdfList.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <strong>PDF en IndexedDB:</strong>
            <ul>
              {pdfList.map((pdf) => (
                <li key={pdf.id}>
                  {pdf.name} ({(pdf.size / 1024).toFixed(1)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {statusMsg && <div className="status">{statusMsg}</div>}
    </div>
  );
}
