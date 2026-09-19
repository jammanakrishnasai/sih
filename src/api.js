const BASE = '/api'

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `${path} failed: ${res.status}`)
  }
  return res.json()
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `${path} failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  analyze: (payload) => post('/analyze', payload),
  graph: () => get('/graph'),
  escalate: (payload) => post('/escalate', payload),
  feedback: (payload) => post('/feedback', payload),
  evalSummary: () => get('/eval'),
  health: () => get('/health'),
  listConnectors: () => get('/connectors'),
  grantConsent: (payload) => post('/connectors/consent', payload),
  revokeConsent: (payload) => post('/connectors/revoke', payload),
  fetchConnectorData: (sourceId) => get(`/connectors/data/${sourceId}`),
  runBenchmark: () => post('/eval/benchmark', {}),
  exportPdf: async (analysisData) => {
    const res = await fetch(`${BASE}/export/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis_data: analysisData }),
    })
    if (!res.ok) throw new Error(`PDF Export failed: ${res.status}`)
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sutradhara_ip_report.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  },
}
