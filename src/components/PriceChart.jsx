import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getChartData } from '../services/api'

const TIME_FILTERS = [
  { label: '1H', days: 0.04 },
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '1Y', days: 365 },
]

function formatTime(timestamp, days) {
  const date = new Date(timestamp)
  if (days <= 0.25) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (days <= 1) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (days <= 7) return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function CustomTooltip({ active, payload, days }) {
  if (!active || !payload?.length) return null
  const { timestamp, price } = payload[0].payload
  return (
    <div className="sim-chart-tooltip">
      <p className="sim-chart-tooltip-price">${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
      <p className="sim-chart-tooltip-time">{new Date(timestamp).toLocaleString()}</p>
    </div>
  )
}

export default function PriceChart({ symbol, currentPrice, priceChange }) {
  const [data, setData] = useState([])
  const [activeDays, setActiveDays] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setActiveDays(1)
  }, [symbol])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getChartData(symbol, activeDays)
      .then(chartData => {
        if (!cancelled) setData(chartData)
      })
      .catch(() => {
        if (!cancelled) setData([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [symbol, activeDays])

  const isPositive = priceChange >= 0
  const strokeColor = isPositive ? '#16a34a' : '#dc2626'
  const gradientColor = isPositive ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)'

  return (
    <div className="sim-chart-container">
      <div className="sim-time-filters">
        {TIME_FILTERS.map(f => (
          <button
            key={f.days}
            className={activeDays === f.days ? 'active' : ''}
            onClick={() => setActiveDays(f.days)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ height: 16 }} />
      {loading ? (
        <div className="sim-chart-loading">Loading chart...</div>
      ) : data.length === 0 ? (
        <div className="sim-chart-loading">No chart data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id={`chartGrad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timestamp"
              tickFormatter={(ts) => formatTime(ts, activeDays)}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v.toLocaleString()}`}
              width={70}
            />
            <Tooltip content={<CustomTooltip days={activeDays} />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#chartGrad-${symbol})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: strokeColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
