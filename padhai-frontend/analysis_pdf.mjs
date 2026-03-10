// ESM version for Node 20+ (run with `node --input-type=module analysis_pdf.js`)
import fs from 'fs';

async function run() {
  const path = 'c:/Users/Shashwat Mishra/Desktop/MS/MICROSOFT AI UNLOCKED.pdf';
  const data = new Uint8Array(fs.readFileSync(path));
  let pdfjsLib;
  try {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch (_) {
    pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
  }
  try {
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    console.log('numPages', pdf.numPages);
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str).join(' ');
      console.log(`page ${i} text length`, strings.length);
      if (strings.trim().length > 0) console.log(strings.slice(0,200));
    }
  } catch (e) {
    console.error('pdfjs error', e);
  }
}

run();