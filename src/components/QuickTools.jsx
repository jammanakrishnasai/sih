import { useState, useEffect } from 'react'
import { ShieldCheck, ScrollText, Loader2, Search, Check, Minus, AlertCircle, Database, FileText, Download, Lock, CheckCircle, XCircle } from 'lucide-react'
import { api } from '../api'
import JurisdictionSwitch from './JurisdictionSwitch'
import SourceCard from './SourceCard'

function ToolShell({ icon: Icon, title, lede, copy, children }) {
  return (
    <div className="animate-in">
      <div className="flex items-start gap-3 mb-1">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-green/15 bg-green-pale text-green shrink-0 mt-0.5">
          <Icon size={17} strokeWidth={2.2} />
        </span>
        <div>
          <p className="section-kicker mb-1">{copy.focusedTool}</p>
          <h2 className="font-serif text-2xl text-green-dark leading-tight">{title}</h2>
          <p className="text-sm text-ink/60 mt-1 max-w-2xl">{lede}</p>
        </div>
      </div>
      <div className="mt-6 tool-surface">{children}</div>
    </div>
  )
}

function QueryBox({ value, onChange, placeholder, onSubmit, loading, buttonLabel, loadingLabel, extra }) {
  return (
    <div className="dossier-panel p-4 sm:p-5 mb-6 border-green/20">
      {extra && <div className="flex items-center justify-end mb-3">{extra}</div>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="research-input w-full min-h-24 border border-hairline rounded-md px-4 py-3 text-sm leading-relaxed focus:outline-none"
      />
      <div className="flex justify-end mt-3">
        <button
          onClick={onSubmit}
          disabled={!value.trim() || loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green text-paper text-sm font-semibold rounded-md hover:bg-green-dark hover:-translate-y-0.5 disabled:opacity-50 transition-all shadow-panel"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? loadingLabel : buttonLabel}
        </button>
      </div>
    </div>
  )
}

export function TKDLResemblanceCard({ tkdl, copy }) {
  if (!tkdl) return null
  const score = tkdl.score ?? 0.0
  const band = tkdl.risk_band ?? 'LOW_RESEMBLANCE'
  const isHigh = score >= 50.0

  return (
    <div className="dossier-panel p-5 border-l-4 border-l-gold animate-in mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <ScrollText size={18} className="text-gold-dark" />
          <h3 className="font-serif text-lg text-green-dark">{copy.tkdlResemblanceTitle || 'TKDL Resemblance Score'}</h3>
        </div>
        <span className={`px-3 py-1 text-xs font-bold rounded-full ${isHigh ? 'bg-rust/15 text-rust border border-rust/30' : 'bg-gold-light/20 text-gold-dark border border-gold/40'}`}>
          {tkdl.risk_label || band}
        </span>
      </div>

      <div className="flex items-center gap-4 my-3">
        <div className="text-3xl font-bold font-serif text-green-dark">{score}%</div>
        <div className="flex-1">
          <div className="h-2.5 w-full bg-hairline rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isHigh ? 'bg-rust' : 'bg-gold'}`}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
          <p className="text-xs text-ink/50 mt-1">Matched terms: {(tkdl.matched_terms || []).join(', ') || 'None'}</p>
        </div>
      </div>

      {tkdl.breakdown && (
        <div className="grid grid-cols-3 gap-2 mt-4 text-xs text-ink/75 border-t border-hairline/60 pt-3">
          <div><span className="text-ink/45 block">Query Weight</span><strong>{tkdl.breakdown.query_term_weight} pts</strong></div>
          <div><span className="text-ink/45 block">TK Evidence</span><strong>{tkdl.breakdown.retrieved_tk_evidence_weight} pts</strong></div>
          <div><span className="text-ink/45 block">Category Weight</span><strong>{tkdl.breakdown.category_prior_art_weight} pts</strong></div>
        </div>
      )}
    </div>
  )
}

export function RegulatoryChecklistCard({ checklist, copy }) {
  if (!checklist || !checklist.items) return null

  return (
    <div className="dossier-panel p-5 border-l-4 border-l-green animate-in mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-green" />
          <h3 className="font-serif text-lg text-green-dark">{copy.regulatoryChecklistTitle || 'Regulatory Pathway Compliance Checklist'}</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-green-pale text-green rounded-md border border-green/20">
          Progress: {checklist.progress_percentage}% ({checklist.completed_items}/{checklist.total_items})
        </span>
      </div>

      <div className="space-y-3 mt-4">
        {checklist.items.map((item) => (
          <div key={item.id} className="p-3 border border-hairline/60 rounded-md bg-paper/60 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-green-dark flex items-center gap-2">
                {item.status === 'COMPLETED' ? <CheckCircle size={15} className="text-green shrink-0" /> : <Minus size={15} className="text-gold-dark shrink-0" />}
                {item.title}
              </p>
              <p className="text-xs text-ink/65 mt-1">{item.description}</p>
              <p className="text-[11px] text-ink/45 mt-1">Authority: <strong>{item.authority}</strong></p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${item.status === 'COMPLETED' ? 'bg-green/15 text-green' : item.status === 'ACTION_REQUIRED' ? 'bg-rust/15 text-rust' : 'bg-gold-light/20 text-gold-dark'}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PDFExportButton({ analysisData, copy }) {
  const [downloading, setDownloading] = useState(false)

  async function handleExport() {
    if (!analysisData) return
    setDownloading(true)
    try {
      await api.exportPdf(analysisData)
    } catch (e) {
      alert('PDF generation failed: ' + e.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={downloading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gold-dark text-paper text-xs font-semibold rounded-md hover:bg-gold transition-colors shadow-sm disabled:opacity-50"
    >
      {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      {copy.exportPdfButton || 'Export PDF Report'}
    </button>
  )
}

export function ConnectorsTool({ copy }) {
  const [connectors, setConnectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState(null)
  const [testError, setTestError] = useState(null)
  const [activeSourceId, setActiveSourceId] = useState(null)

  useEffect(() => {
    loadConnectors()
  }, [])

  async function loadConnectors() {
    setLoading(true)
    try {
      const list = await api.listConnectors()
      setConnectors(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleGrant(sourceId) {
    try {
      await api.grantConsent({ source_id: sourceId })
      await loadConnectors()
      setTestResult(null)
      setTestError(null)
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleRevoke(sourceId) {
    try {
      await api.revokeConsent({ source_id: sourceId })
      await loadConnectors()
      setTestResult(null)
      setTestError(null)
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleTestAccess(sourceId) {
    setActiveSourceId(sourceId)
    setTestResult(null)
    setTestError(null)
    try {
      const res = await api.fetchConnectorData(sourceId)
      setTestResult(res)
    } catch (e) {
      setTestError(e.message)
    }
  }

  return (
    <ToolShell
      icon={Database}
      title={copy.paidConnectorsTitle || 'Paid Data Source Connectors & Consent Lifecycle Manager'}
      lede="Manage authentication and consent linkage for premium external databases. Immediate FAIL-CLOSED enforcement blocks access (HTTP 403) upon revocation."
      copy={copy}
    >
      {loading ? (
        <div className="dossier-panel p-6 h-36 skeleton rounded-md" />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {connectors.map((c) => (
              <div key={c.id} className="dossier-panel p-4 border border-hairline flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold-dark">{c.tier}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.consent_granted ? 'bg-green/15 text-green' : 'bg-rust/15 text-rust'}`}>
                      {c.consent_granted ? 'CONSENT LINKED' : 'REVOKED'}
                    </span>
                  </div>
                  <h4 className="font-serif font-semibold text-green-dark text-base">{c.name}</h4>
                  <p className="text-xs text-ink/60 mt-1">Provider: {c.provider}</p>
                  <p className="text-[11px] text-ink/50 mt-1">Scope: {c.scope}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between flex-wrap gap-2">
                  {c.consent_granted ? (
                    <button
                      onClick={() => handleRevoke(c.id)}
                      className="px-3 py-1.5 bg-rust/10 text-rust text-xs font-semibold rounded hover:bg-rust/20 transition-colors"
                    >
                      {copy.revokeConsent || 'Revoke Consent'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGrant(c.id)}
                      className="px-3 py-1.5 bg-green/10 text-green text-xs font-semibold rounded hover:bg-green/20 transition-colors"
                    >
                      {copy.linkConsent || 'Grant Consent & Link'}
                    </button>
                  )}
                  <button
                    onClick={() => handleTestAccess(c.id)}
                    className="px-3 py-1.5 border border-hairline text-ink/80 text-xs font-medium rounded hover:bg-paper transition-colors"
                  >
                    {copy.testAccess || 'Test Access'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {activeSourceId && (
            <div className="mt-6 p-4 dossier-panel border-hairline animate-in">
              <h4 className="text-sm font-semibold text-green-dark mb-2">Access Test Result for: {activeSourceId}</h4>
              {testResult && (
                <div className="p-3 bg-green-pale/40 border border-green/30 rounded text-xs text-green-dark">
                  <p className="font-bold flex items-center gap-1.5"><CheckCircle size={14} /> AUTHORIZED DATA ACCESS CONFIRMED</p>
                  <p className="mt-1">Retrieved records from scope: {testResult.scope}</p>
                  <ul className="mt-2 space-y-1">
                    {(testResult.sample_records || []).map((r) => (
                      <li key={r.record_id} className="font-mono">{r.record_id}: {r.title}</li>
                    ))}
                  </ul>
                </div>
              )}
              {testError && (
                <div className="p-4 bg-rust/10 border border-rust/40 rounded text-xs text-rust font-semibold flex items-start gap-2">
                  <XCircle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold uppercase tracking-wider">FAIL-CLOSED ACCESS DENIED (HTTP 403 FORBIDDEN)</p>
                    <p className="mt-1 font-normal">{testError}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </ToolShell>
  )
}

export function ABSTool({ copy, language }) {
  const [query, setQuery] = useState('')
  const [jurisdiction, setJurisdiction] = useState('India')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.analyze({ query, jurisdiction, language })
      setResult(res)
    } catch (e) {
      setError(copy.systemError)
    } finally {
      setLoading(false)
    }
  }

  const checklist = result?.abs_checklist

  return (
    <ToolShell icon={ShieldCheck} title={copy.absTitle} lede={copy.absLede} copy={copy}>
      <QueryBox
        value={query}
        onChange={setQuery}
        placeholder={copy.absPlaceholder}
        onSubmit={run}
        loading={loading}
        buttonLabel={copy.absButton}
        loadingLabel={copy.working}
        extra={<JurisdictionSwitch value={jurisdiction} onChange={setJurisdiction} copy={copy} />}
      />

      {error && <p className="text-sm text-rust mb-4">{error}</p>}

      {result && (
        checklist ? (
          <div className="dossier-panel p-5 border-gold/40 animate-in">
            <p className="section-kicker mb-3 font-medium flex items-center gap-2">
              <Search size={14} />
              {copy.absConsiderations}
            </p>
            <ul className="text-sm space-y-2 text-ink/75">
              <li className="flex items-center gap-2">{checklist.biological_resource_involved ? <Check size={15} className="text-green" /> : <Minus size={15} className="text-ink/35" />} {copy.absChecklist.biologicalResource}</li>
              <li className="flex items-center gap-2">{checklist.provenance_identified ? <Check size={15} className="text-green" /> : <Minus size={15} className="text-ink/35" />} {copy.absChecklist.provenance}</li>
              <li className="flex items-center gap-2">{checklist.abs_framework_identified ? <Check size={15} className="text-green" /> : <Minus size={15} className="text-ink/35" />} {copy.absChecklist.framework}</li>
              <li className="flex items-center gap-2">{checklist.supporting_source_retrieved ? <Check size={15} className="text-green" /> : <Minus size={15} className="text-ink/35" />} {copy.absChecklist.source}</li>
            </ul>
            <p className="text-xs text-ink/50 mt-3">{checklist.note}</p>
          </div>
        ) : (
          <div className="dossier-panel p-6 text-center text-sm text-ink/50"><AlertCircle size={18} className="mx-auto mb-2 text-gold-dark" />{copy.absNotTriggered}</div>
        )
      )}

      {!result && !loading && !error && (
        <EmptyTool icon={ShieldCheck} label={copy.absChecklistLabel} preview={copy.preview} text={copy.absEmpty} />
      )}
    </ToolShell>
  )
}

export function TKDLTool({ copy, language }) {
  const [query, setQuery] = useState('')
  const [jurisdiction, setJurisdiction] = useState('India')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.analyze({ query, jurisdiction, language })
      setResult(res)
    } catch (e) {
      setError(copy.systemError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolShell icon={ScrollText} title={copy.tkdlTitle} lede={copy.tkdlLede} copy={copy}>
      <QueryBox
        value={query}
        onChange={setQuery}
        placeholder={copy.tkdlPlaceholder}
        onSubmit={run}
        loading={loading}
        buttonLabel={copy.tkdlButton}
        loadingLabel={copy.working}
        extra={<JurisdictionSwitch value={jurisdiction} onChange={setJurisdiction} copy={copy} />}
      />

      {error && <p className="text-sm text-rust mb-4">{error}</p>}

      {result && !result.needs_clarification && (
        <>
          <TKDLResemblanceCard tkdl={result.tkdl_resemblance} copy={copy} />
          {result.tk_pointer ? (
            <>
              <div className="dossier-panel p-5 border-gold/40 animate-in mb-4">
                <p className="section-kicker mb-1.5 font-medium flex items-center gap-2">
                  <Search size={14} />
                  {copy.tkPointer}
                </p>
                <p className="text-sm text-ink/75">{result.tk_pointer}</p>
              </div>
              {result.sources?.length > 0 && (
                <div className="grid gap-3">
                  {result.sources.map((s, i) => (
                    <SourceCard key={s.id} source={s} index={i} copy={copy} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="dossier-panel p-6 text-center text-sm text-ink/50">{copy.tkdlNotTriggered}</div>
          )}
        </>
      )}

      {!result && !loading && !error && (
        <EmptyTool icon={ScrollText} label={copy.tkdlPointerLabel} preview={copy.preview} text={copy.tkdlEmpty} />
      )}
    </ToolShell>
  )
}

function EmptyTool({ icon: Icon, label, preview, text }) {
  return <div className="tool-empty"><div className="ghost-document"><Icon size={18} /><span /><span /><span /></div><div><p className="citation-marker text-[10px] uppercase tracking-[0.14em] text-gold-dark">{label} {preview}</p><p className="text-sm text-ink/55 mt-1 max-w-sm">{text}</p></div></div>
}
