import React, {useState, useRef} from 'react'

export default function UploadNote({onSummary, onNotesChange}){
  const [text,setText] = useState('')
  const [detail,setDetail] = useState('brief')
  const [loading,setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [pdfFile, setPdfFile] = useState(null)   // { name, size, base64 }
  const [pdfLoading, setPdfLoading] = useState(false)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  async function handleFileUpload(e){
    const file = e.target.files?.[0]
    if(!file) return
    
    if(file.type.startsWith('image/')){
      // clear any existing PDF
      setPdfFile(null)
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const dataUrl = ev.target.result
        setImagePreview(dataUrl)
        // try to extract text automatically via OCR
        try {
          const base64 = dataUrl.split(',').pop()
          const resp = await fetch('http://localhost:4000/api/notes/ocr', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ imageBase64: base64 })
          });
          if (!resp.ok) { console.warn('OCR auto error', await resp.text()); return; }
          const j = await resp.json();
          if (j.text) { setText(j.text); onNotesChange?.(j.text); }
        } catch (e) {
          console.warn('auto OCR failed', e);
        }
      }
      reader.readAsDataURL(file)

    } else if(file.type === 'text/plain' || file.type === 'application/octet-stream'){
      setPdfFile(null); setImagePreview(null)
      const reader = new FileReader()
      reader.onload = (ev) => {
        const content = ev.target.result
        setText(content)
        onNotesChange?.(content)
      }
      reader.readAsText(file)

    } else if(file.type === 'application/pdf'){
      // clear image, show PDF preview immediately
      setImagePreview(null)
      setPdfLoading(true)
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const dataUrl = ev.target.result
        const base64 = dataUrl.split(',').pop()
        setPdfFile({ name: file.name, size: file.size, base64 })
        setPdfLoading(false)
      }
      reader.readAsDataURL(file)
    }

    // reset input so same file can be re-uploaded
    e.target.value = ''
  }

  async function handleCameraCapture(e){
    const file = e.target.files?.[0]
    if(!file) return
    setPdfFile(null)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      setImagePreview(dataUrl)
      try {
        const base64 = dataUrl.split(',').pop()
        const resp = await fetch('http://localhost:4000/api/notes/ocr', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ imageBase64: base64 })
        });
        if (!resp.ok) return;
        const j = await resp.json();
        if (j.text) { setText(j.text); onNotesChange?.(j.text); }
      } catch (err) {
        console.warn('camera OCR failed', err);
      }
    }
    reader.readAsDataURL(file)
  }

  async function submit(){
    if(!text.trim() && !imagePreview && !pdfFile){
      alert('Please paste/upload notes, an image, or a PDF first')
      return
    }
    setLoading(true)
    try {
      if (pdfFile) {
        // send PDF directly to Gemini
        const resp = await fetch('http://localhost:4000/api/notes/pdf', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ pdfBase64: pdfFile.base64, detail })
        })
        const j = await resp.json()
        if (!resp.ok) {
          alert('PDF summarization failed: ' + (j.details || j.error || 'unknown error'))
          onSummary('')
        } else {
          onSummary(j.summary || '')
          onNotesChange?.(j.summary || '') // make summary available to quiz tab
          onNotesChange?.(j.summary || '') // so quiz tab can generate questions from PDF summary
        }
      } else if (imagePreview && !text.trim()) {
        // vision-based summarization
        const base64 = imagePreview.split(',').pop()
        const res = await fetch('http://localhost:4000/api/notes/summarize', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ imageBase64: base64, detail })
        })
        const j = await res.json()
        if (!res.ok) {
          alert('Summarization failed: ' + (j.details || j.error || 'unknown error'))
          onSummary('')
        } else {
          onSummary(typeof j.summary === 'string' ? j.summary : '')
        }
      } else {
        // text-based summarization
        const res = await fetch('http://localhost:4000/api/notes/summarize', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ text, detail })
        })
        const j = await res.json()
        if (!res.ok) {
          alert('Summarization failed: ' + (j.details || j.error || 'unknown error'))
          onSummary('')
        } else {
          onSummary(typeof j.summary === 'string' ? j.summary : '')
        }
      }
    } catch(e) {
      alert('Error: ' + e.message)
      onSummary('')
    }
    setLoading(false)
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div style={{marginBottom:20, border:'1px solid #ccc', padding:15, borderRadius:8}}>
      <h3>Upload or Capture Notes</h3>
      
      {/* File & Camera Inputs */}
      <div style={{marginBottom:12, display:'flex', gap:8, flexWrap:'wrap'}}>
        <button onClick={()=>fileInputRef.current?.click()} style={{padding:'8px 12px', cursor:'pointer', backgroundColor:'#28a745', color:'white', border:'none', borderRadius:4, fontWeight:'bold'}}>
          📁 Upload File
        </button>
        <span style={{fontSize:12, color:'#666', alignSelf:'center'}}>(.txt, .pdf or image)</span>
        <button onClick={()=>cameraInputRef.current?.click()} style={{padding:'8px 12px', cursor:'pointer', backgroundColor:'#007bff', color:'white', border:'none', borderRadius:4, fontWeight:'bold'}}>
          📷 Take Photo
        </button>
        <input ref={fileInputRef} type="file" accept="image/*,.txt,.pdf" onChange={handleFileUpload} style={{display:'none'}} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleCameraCapture} style={{display:'none'}} />
      </div>

      {/* PDF Loading Spinner */}
      {pdfLoading && (
        <div style={{marginBottom:12, padding:12, backgroundColor:'#fff3cd', border:'1px solid #ffc107', borderRadius:4, fontSize:14}}>
          ⏳ Reading PDF...
        </div>
      )}

      {/* PDF Preview */}
      {pdfFile && !pdfLoading && (
        <div style={{marginBottom:12, padding:12, backgroundColor:'#f0f8ff', border:'1px solid #007bff', borderRadius:4}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <span style={{fontSize:32}}>📄</span>
              <div>
                <div style={{fontWeight:'bold', fontSize:14, color:'#333'}}>{pdfFile.name}</div>
                <div style={{fontSize:12, color:'#666'}}>{formatSize(pdfFile.size)} · PDF Document</div>
                <div style={{fontSize:12, color:'#28a745', marginTop:2}}>✅ Ready — click "📝 Summarize" to analyse with AI</div>
              </div>
            </div>
            <button onClick={()=>setPdfFile(null)} style={{padding:'6px 10px', backgroundColor:'#dc3545', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:12}}>
              🗑️ Remove
            </button>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div style={{marginBottom:12, border:'1px solid #ddd', padding:10, borderRadius:4, backgroundColor:'#f9f9f9'}}>
          <p style={{fontSize:12, color:'#666', marginTop:0}}>📸 <strong>Image Uploaded</strong></p>
          <img src={imagePreview} alt="preview" style={{maxWidth:'100%', maxHeight:250, border:'1px solid #ddd', borderRadius:4, display:'block'}} />
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <button onClick={()=>setImagePreview(null)} style={{padding:'6px 12px', backgroundColor:'#dc3545', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:12}}>
              🗑️ Clear Image
            </button>
          </div>
          <p style={{fontSize:12, color:'#666', marginTop:4}}>(Click "📝 Summarize" below to analyse this image with AI)</p>
        </div>
      )}

      {/* Text Input */}
      <textarea 
        value={text} 
        onChange={e=>{ setText(e.target.value); onNotesChange?.(e.target.value); }}
        placeholder="Paste or type notes here, or upload a PDF / image above..." 
        rows={8} 
        style={{width:'100%', padding:8, borderRadius:4, border:'1px solid #ddd', fontFamily:'monospace', boxSizing:'border-box', fontSize:'14px'}} 
      />
      
      <div style={{marginTop:12, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
        <label style={{fontWeight:'bold'}}>Detail Level:</label>
        <select value={detail} onChange={e=>setDetail(e.target.value)} style={{padding:'6px 8px', borderRadius:4, border:'1px solid #ddd'}}>
          <option value="brief">Brief Summary</option>
          <option value="detailed">Detailed Explanation</option>
        </select>
        <button 
          onClick={submit} 
          disabled={loading || pdfLoading} 
          style={{padding:'8px 16px', cursor:(loading||pdfLoading)?'not-allowed':'pointer', backgroundColor:(loading||pdfLoading)?'#ccc':'#007bff', color:'white', border:'none', borderRadius:4, fontWeight:'bold', marginLeft:'auto'}}
        >
          {loading ? '⏳ Summarizing...' : '📝 Summarize'}
        </button>
      </div>
    </div>
  )
}
