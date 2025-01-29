// src/db.js
import Dexie from 'dexie';

export const db = new Dexie('pptPdfDB');

// Two stores: ppts and pdfs
db.version(1).stores({
  ppts: '++id,name,size,type,data',
  pdfs: '++id,name,size,type,data'
});
