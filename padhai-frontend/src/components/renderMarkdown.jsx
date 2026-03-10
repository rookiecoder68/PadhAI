import React from 'react'

export function renderInline(text) {
  const segments = String(text).split(/(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|`[^`\n]+?`)/g)
  return segments.map((seg, i) => {
    if (seg.startsWith('**') && seg.endsWith('**') && seg.length > 4)
      return <strong key={i}>{seg.slice(2, -2)}</strong>
    if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2)
      return <em key={i}>{seg.slice(1, -1)}</em>
    if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2)
      return <code key={i} style={{ backgroundColor: '#f1f3f5', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', fontSize: '0.88em' }}>{seg.slice(1, -1)}</code>
    return seg
  })
}

export function renderMarkdown(text) {
  if (!text) return null
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim()
    const indent = line.length - line.trimStart().length

    if (!trimmed) return <div key={i} style={{ height: 8 }} />
    if (trimmed === '---') return <hr key={i} style={{ border: 'none', borderTop: '1px solid #dee2e6', margin: '10px 0' }} />
    if (trimmed.startsWith('### ')) return <h4 key={i} style={{ margin: '12px 0 4px', color: '#0056b3', fontSize: 15 }}>{renderInline(trimmed.slice(4))}</h4>
    if (trimmed.startsWith('## ')) return <h3 key={i} style={{ margin: '14px 0 5px', color: '#007bff', fontSize: 16 }}>{renderInline(trimmed.slice(3))}</h3>
    if (trimmed.startsWith('# ')) return <h2 key={i} style={{ margin: '16px 0 6px', color: '#0056b3', fontSize: 18 }}>{renderInline(trimmed.slice(2))}</h2>

    const bulletMatch = trimmed.match(/^[\*\-]\s+(.*)/)
    if (bulletMatch) return (
      <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 3, paddingLeft: indent > 2 ? 28 : 8 }}>
        <span style={{ color: '#007bff', flexShrink: 0, marginTop: 2, fontSize: 12 }}>●</span>
        <span style={{ lineHeight: 1.6 }}>{renderInline(bulletMatch[1])}</span>
      </div>
    )

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
    if (numMatch) return (
      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, paddingLeft: 8 }}>
        <span style={{ color: '#007bff', flexShrink: 0, fontWeight: 'bold', minWidth: 20 }}>{numMatch[1]}.</span>
        <span style={{ lineHeight: 1.6 }}>{renderInline(numMatch[2])}</span>
      </div>
    )

    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4)
      return <div key={i} style={{ fontWeight: 'bold', fontSize: 14, marginTop: 10, marginBottom: 3, color: '#1a1a1a' }}>{trimmed.slice(2, -2)}</div>

    return <p key={i} style={{ margin: '3px 0 5px', lineHeight: 1.65 }}>{renderInline(trimmed)}</p>
  })
}
