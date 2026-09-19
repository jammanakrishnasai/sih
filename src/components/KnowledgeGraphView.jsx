import { useEffect, useState } from 'react'
import { Network } from 'lucide-react'
import { api } from '../api'

const NODE_W = 132
const NODE_H = 42

function computePositions(nodes) {
  const columns = {
    Product: { x: 75, color: '#1F3B2C' },
    ProductCategory: { x: 260, color: '#1F3B2C' },
    IPRegime: { x: 460, color: '#8F6A22' },
    Law: { x: 660, color: '#8F6A22' },
    Provision: { x: 860, color: '#8F6A22' },
    Source: { x: 1045, color: '#2E5940' },
  }

  const grouped = {}
  nodes.forEach((n) => {
    const t = n.type || 'Product'
    if (!grouped[t]) grouped[t] = []
    grouped[t].push(n)
  })

  const positions = {}
  Object.keys(grouped).forEach((type) => {
    const list = grouped[type]
    const colInfo = columns[type] || { x: 500, color: '#8F6A22' }
    const count = list.length
    list.forEach((n, idx) => {
      let y = 135
      if (count === 2) {
        y = idx === 0 ? 70 : 200
      } else if (count === 3) {
        y = idx === 0 ? 55 : idx === 1 ? 135 : 215
      } else if (count > 3) {
        y = 45 + idx * (190 / (count - 1))
      }
      positions[n.id] = { x: colInfo.x, y, color: colInfo.color }
    })
  })
  return positions
}

function edgePath(from, to) {
  if (from.y === to.y) {
    return `M ${from.x + NODE_W / 2} ${from.y} L ${to.x - NODE_W / 2} ${to.y}`
  }
  const midX = (from.x + to.x) / 2
  return `M ${from.x + NODE_W / 2} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x - NODE_W / 2} ${to.y}`
}

export default function KnowledgeGraphView({ copy, result }) {
  const [graph, setGraph] = useState(result?.graph || null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (result?.graph) {
      setGraph(result.graph)
    } else {
      api.graph().then(setGraph).catch(() => setError(true))
    }
  }, [result])

  if (error) {
    return (
      <div className="data-stage p-8 text-center text-sm text-paper/60">
        {copy?.graphEmpty}
      </div>
    )
  }

  if (!graph) {
    return <div className="data-stage p-6 h-64 skeleton rounded-md" />
  }

  const positions = computePositions(graph.nodes || [])

  return (
    <div className="data-stage p-5 sm:p-6 animate-in">
      <div className="flex items-center gap-2 mb-1">
        <Network size={16} className="text-gold-light" />
        <div>
          <p className="section-kicker">{copy.graphGrounding}</p>
          <h3 className="font-serif text-xl text-green-dark">{copy.explainabilityGraph}</h3>
        </div>
      </div>
      <p className="text-xs text-paper/65 mb-5 max-w-xl">{graph.note}</p>

      <div className="overflow-x-auto -mx-2 px-2">
        <svg viewBox="0 0 1130 270" className="w-full h-auto min-w-[760px] drop-shadow-[0_6px_8px_rgba(20,42,31,0.08)]">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#B8862E" />
            </marker>
          </defs>

          {graph.edges.map((e, i) => {
            const from = positions[e.from]
            const to = positions[e.to]
            if (!from || !to) return null
            const midX = (from.x + to.x) / 2
            const midY = from.y === to.y ? from.y : (from.y + to.y) / 2
            const edgeLabel = copy?.graphEdges?.[`${e.from}_${e.to}`] || e.label
            return (
              <g key={i}>
                <path
                  d={edgePath(from, to)}
                  fill="none"
                  stroke="#B8AA82"
                  strokeWidth="1.8"
                  markerEnd="url(#arrow)"
                />
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect x={-edgeLabel.length * 3.1} y={-9} width={edgeLabel.length * 6.2} height={16} rx={8} fill="#FAF7EF" stroke="#EAE0C4" />
                  <text
                    fontSize="9.5"
                    fill="#8F6A22"
                    fontFamily="IBM Plex Mono, monospace"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    y={1}
                  >
                    {edgeLabel}
                  </text>
                </g>
              </g>
            )
          })}

          {graph.nodes.map((n) => {
            const pos = positions[n.id]
            if (!pos) return null
            const displayLabel = copy?.graphNodes?.[n.id] || copy?.classificationCategories?.[n.label] || copy?.areaLabels?.[n.label] || n.label
            return (
              <g key={n.id}>
                <rect
                  x={pos.x - NODE_W / 2}
                  y={pos.y - NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                  rx="7"
                  fill="#FFFFFE"
                  stroke={pos.color}
                  strokeWidth="1.4"
                />
                <rect x={pos.x - NODE_W / 2} y={pos.y - NODE_H / 2} width="4" height={NODE_H} rx="2" fill={pos.color} />
                <text
                  x={pos.x}
                  y={pos.y}
                  fontSize="10.5"
                  fill="#1F3B2C"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="IBM Plex Sans, sans-serif"
                >
                  {displayLabel.length > 20 ? displayLabel.substring(0, 18) + '…' : displayLabel}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-hairline flex-wrap">
        {[
          { color: '#1F3B2C', label: copy.graphLegend.query },
          { color: '#8F6A22', label: copy.graphLegend.regulatory },
          { color: '#A03E2A', label: copy.graphLegend.traditional },
          { color: '#2E5940', label: copy.graphLegend.authoritative },
        ].map(({ color, label }) => (
          <span key={label} className="inline-flex items-center gap-1.5 text-xs text-paper/70">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
