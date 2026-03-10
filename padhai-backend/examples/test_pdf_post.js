// Node script to POST PDF to backend and log response
const fs = require('fs');
const fetch = require('node-fetch');

async function run() {
  const pdfPath = 'C:/Users/Shashwat Mishra/Desktop/MS/MICROSOFT AI UNLOCKED.pdf';
  const data = fs.readFileSync(pdfPath);
  const b64 = data.toString('base64');
  const resp = await fetch('http://localhost:4000/api/notes/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfBase64: b64 })
  });
  const text = await resp.text();
  console.log('status', resp.status, 'body', text.slice(0,500));
}
run().catch(console.error);
