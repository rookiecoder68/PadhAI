// quick node script to attempt to extract text from the problematic PDF
const fs = require('fs');
// pdfjs-dist may need to be required from frontend/node_modules
let pdfjsLib;
try {
  pdfjsLib = require('pdfjs-dist/legacy/build/pdf');
} catch(_) {
  // fallback maybe older path
  pdfjsLib = require('pdfjs-dist');
}

async function run() {
  const data = new Uint8Array(fs.readFileSync('c:/Users/Shashwat Mishra/Desktop/MS/MICROSOFT AI UNLOCKED.pdf'));
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
