// src/utils/pdfHelper.js
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';

// We tell pdf.js to use the worker from /pdf.worker.js in the public folder
GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

// Export the configured pdf.js library
export default pdfjsLib;
