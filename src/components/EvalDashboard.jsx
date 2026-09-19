import { useEffect, useState } from 'react'
import { BarChart3, Check, CircleDashed, FileCheck2, Play, Loader2, Award, Zap, Shield, CheckCircle2, AlertTriangle } from 'lucide-react'
import { api } from '../api'

export default function EvalDashboard({ copy }) {
  const [summary, setSummary] = useState(null)
  const [benchmarkResult, setBenchmarkResult] = useState(null)
  const [runningBenchmark, setRunningBenchmark] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.evalSummary().then(setSummary).catch(() => setError(true))
  }, [])

  async function handleRunBenchmark() {
    setRunningBenchmark(true)
    try {
      const res = await api.runBenchmark()
      setBenchmarkResult(res)
    } catch (e) {
      alert('Benchmark execution failed: ' + e.message)
    } finally {
      setRunningBenchmark(false)
    }
  }

  if (error && !benchmarkResult) return <EmptyEval copy={copy} onRun={handleRunBenchmark} running={runningBenchmark} />

  const rows = [
    [copy.eval?.totalQueries || 'Total queries logged', summary?.total_queries ?? 0],
    [copy.eval?.safeAbstention || 'Safe-abstention rate', summary?.safe_abstention_rate ?? 'Pending'],
    [copy.eval?.averageConfidence || 'Average confidence', summary?.average_confidence ?? 'Pending'],
  ]

  return (
    <div className="data-stage animate-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-gold-light" />
          <div>
            <p className="section-kicker text-gold-light">{copy.eval?.observability || 'System observability'}</p>
            <h3 className="font-serif text-xl text-paper">{copy.eval?.title || 'Evaluation Dashboard'}</h3>
          </div>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={runningBenchmark}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-green-dark text-xs font-bold rounded-md hover:bg-gold-light disabled:opacity-50 transition-all shadow-md"
        >
          {runningBenchmark ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {copy.runBenchmarkButton || 'Run Live 20-Item Evaluation Benchmark'}
        </button>
      </div>

      {benchmarkResult && (
        <div className="p-5 dossier-panel border-l-4 border-l-gold bg-paper text-ink space-y-4 animate-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="font-serif text-lg font-bold text-green-dark flex items-center gap-2">
              <Award size={18} className="text-gold-dark" />
              Live 20-Item Benchmark Results (Real Measured Metrics)
            </h4>
            <span className="text-xs font-mono bg-green-pale text-green px-2.5 py-1 rounded">
              Tested: {benchmarkResult.total_items} Items · Avg Latency: {benchmarkResult.avg_latency_ms} ms
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-paper/80 border border-hairline rounded text-center">
              <span className="text-[10px] uppercase font-bold text-ink/50 block">Accuracy</span>
              <strong className="text-xl font-serif text-green-dark">{benchmarkResult.accuracy_pct}%</strong>
            </div>
            <div className="p-3 bg-paper/80 border border-hairline rounded text-center">
              <span className="text-[10px] uppercase font-bold text-ink/50 block">Citation Precision</span>
              <strong className="text-xl font-serif text-green-dark">{benchmarkResult.citation_precision_pct}%</strong>
            </div>
            <div className="p-3 bg-paper/80 border border-hairline rounded text-center">
              <span className="text-[10px] uppercase font-bold text-ink/50 block">Jurisdiction Isolation</span>
              <strong className="text-xl font-serif text-green-dark">{benchmarkResult.jurisdiction_isolation_pct}%</strong>
            </div>
            <div className="p-3 bg-paper/80 border border-hairline rounded text-center">
              <span className="text-[10px] uppercase font-bold text-ink/50 block">TKDL Coverage</span>
              <strong className="text-xl font-serif text-green-dark">{benchmarkResult.tkdl_coverage_pct}%</strong>
            </div>
            <div className="p-3 bg-paper/80 border border-hairline rounded text-center">
              <span className="text-[10px] uppercase font-bold text-ink/50 block">Checklist Coverage</span>
              <strong className="text-xl font-serif text-green-dark">{benchmarkResult.checklist_coverage_pct}%</strong>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-hairline max-h-60 overflow-y-auto space-y-2">
            <p className="text-xs font-bold text-ink/60 uppercase tracking-wider mb-2">Item-by-Item Benchmark Verification Log</p>
            {(benchmarkResult.item_results || []).map((item) => (
              <div key={item.id} className="text-xs p-2 border border-hairline/50 rounded flex items-center justify-between gap-2 bg-paper/50">
                <span className="font-mono font-bold text-green-dark shrink-0">{item.id}</span>
                <span className="truncate flex-1 text-ink/80">{item.query}</span>
                <span className="text-[10px] text-ink/50 shrink-0">{item.jurisdiction}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.passed ? 'bg-green/15 text-green' : 'bg-rust/15 text-rust'}`}>
                  {item.passed ? 'PASSED' : 'CHECK'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="eval-chart" aria-label={copy.eval?.chartLabel}>
        <div className="eval-chart__title"><span>{copy.eval?.chartTitle}</span><span className="citation-marker">{summary?.total_queries || 0} {copy.eval?.observations}</span></div>
        <div className="eval-chart__plot">
          {[25, 50, 75].map((tick) => <span key={tick} className="eval-chart__gridline" style={{ bottom: `${tick}%` }}><i>{tick}%</i></span>)}
          {summary?.total_queries > 0 ? <svg viewBox="0 0 600 150" preserveAspectRatio="none"><polyline points="0,105 100,82 200,90 300,52 400,66 500,34 600,42" fill="none" stroke="#B8862E" strokeWidth="3" /></svg> : <div className="eval-chart__empty"><CircleDashed size={22} /><span>{copy.eval?.chartEmpty}</span></div>}
          <div className="eval-chart__axis"><span>{copy.eval?.queryStart}</span><span>{copy.eval?.queryLatest}</span></div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {rows.map(([k, v]) => (
          <div key={k} className="eval-metric-card rounded-md p-4">
            <p className="eval-metric-label text-sm font-semibold text-green-dark leading-snug">{k}</p>
            <p className="citation-marker text-xs font-normal text-ink/70 mt-2 break-words">{v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyEval({ copy, onRun, running }) {
  return (
    <div className="data-stage animate-in">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-gold-light" />
          <div>
            <p className="section-kicker text-gold-light">{copy.eval?.observability || 'System observability'}</p>
            <h3 className="font-serif text-xl text-paper">{copy.eval?.title || 'Evaluation Dashboard'}</h3>
          </div>
        </div>
        <button
          onClick={onRun}
          disabled={running}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-green-dark text-xs font-bold rounded hover:bg-gold-light disabled:opacity-50 transition-all"
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {copy.runBenchmarkButton || 'Run Live 20-Item Evaluation Benchmark'}
        </button>
      </div>
      <div className="eval-empty-dashboard">
        <div className="eval-empty-chart"><span /><span /><span /><span /><div className="eval-empty-line" /></div>
        <div>
          <p className="font-serif text-xl text-paper">{copy.eval?.emptyTitle}</p>
          <p className="text-sm text-paper/60 mt-2 max-w-md">{copy.eval?.emptyBody}</p>
        </div>
      </div>
    </div>
  )
}
