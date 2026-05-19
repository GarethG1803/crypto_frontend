import { useState, useEffect, useRef, useCallback } from 'react'
import PriceChart from './PriceChart'
import TradeFeedback from './TradeFeedback'
import {
  getFuturesPortfolio,
  openFuturesPosition,
  closeFuturesPosition,
  updateFuturesOrders,
  getFuturesHistory,
  getFuturesPriceTick,
} from '../services/api'

export default function FuturesTrading({ prices, balance, onTradeComplete }) {
  const [rawPositions, setRawPositions] = useState([])
  const [transactions, setTransactions] = useState([])
  const [selectedCrypto, setSelectedCrypto] = useState(0)
  const [direction, setDirection] = useState('long')
  const [leverage, setLeverage] = useState(5)
  const [marginInput, setMarginInput] = useState('')
  const [tpInput, setTpInput] = useState('')
  const [slInput, setSlInput] = useState('')
  const [rightTab, setRightTab] = useState('positions')
  const [error, setError] = useState('')
  const [tradeFeedback, setTradeFeedback] = useState(null)
  const [triggeredEvents, setTriggeredEvents] = useState([])
  const [livePrices, setLivePrices] = useState(prices || {})
  const [historyPage, setHistoryPage] = useState(0)
  const [expandedTip, setExpandedTip] = useState(null)
  const [editingOrders, setEditingOrders] = useState(null) // positionId being edited
  const [editTp, setEditTp] = useState('')
  const [editSl, setEditSl] = useState('')
  const [editError, setEditError] = useState('')

  // Use ref for the polling callback so interval always calls latest version
  const onTradeCompleteRef = useRef(onTradeComplete)
  useEffect(() => { onTradeCompleteRef.current = onTradeComplete }, [onTradeComplete])

  const loadFuturesData = useCallback((isPolling = false) => {
    const fetches = isPolling
      ? [getFuturesPortfolio()]
      : [getFuturesPortfolio(), getFuturesHistory()]

    Promise.all(fetches)
      .then(([portfolio, history]) => {
        setRawPositions(portfolio.positions || [])
        if (!isPolling && history) setTransactions(history)
        if (portfolio.prices) setLivePrices(portfolio.prices)
        if (portfolio.triggeredEvents && portfolio.triggeredEvents.length > 0) {
          setTriggeredEvents(prev => [...prev, ...portfolio.triggeredEvents])
          onTradeCompleteRef.current()
          if (isPolling) {
            getFuturesHistory().then(h => setTransactions(h || [])).catch(() => {})
          }
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => { loadFuturesData() }, [loadFuturesData])
  useEffect(() => { if (prices) setLivePrices(prices) }, [prices])

  // Poll backend every 10s for liquidation/TP/SL checks + fresh prices
  useEffect(() => {
    const interval = setInterval(() => loadFuturesData(true), 10000)
    return () => clearInterval(interval)
  }, [loadFuturesData])

  // Fast price ticks every 1.5s for real-time P&L movement
  useEffect(() => {
    const interval = setInterval(() => {
      getFuturesPriceTick()
        .then(prices => { if (prices) setLivePrices(prices) })
        .catch(() => {})
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  // Compute positions with real-time P&L from latest livePrices
  // Includes opening fee so user sees TRUE net P&L (what they'd actually gain/lose if closing now)
  const positions = rawPositions.map(pos => {
    const markPrice = livePrices[pos.crypto]?.price || pos.markPrice
    let rawPnl
    if (pos.direction === 'long') {
      rawPnl = (markPrice - pos.entryPrice) * pos.amount
    } else {
      rawPnl = (pos.entryPrice - markPrice) * pos.amount
    }
    const openFee = pos.openFee || 0
    const estCloseFee = pos.amount * markPrice * 0.001
    const unrealizedPnl = rawPnl - openFee - estCloseFee
    const pnlPercent = pos.margin > 0 ? (unrealizedPnl / pos.margin) * 100 : 0
    return { ...pos, markPrice, unrealizedPnl, pnlPercent }
  })

  const cryptoList = Object.entries(livePrices).map(([symbol, data]) => ({
    symbol, ...data,
  }))

  const crypto = cryptoList[selectedCrypto] || { symbol: 'BTC', name: 'Bitcoin', price: 0, change: 0, icon: '₿' }
  const parsedMargin = parseFloat(marginInput) || 0
  const entryPrice = crypto.price
  const notional = parsedMargin * leverage
  const positionSize = entryPrice > 0 ? notional / entryPrice : 0
  const fee = notional * 0.001
  const totalCost = parsedMargin + fee

  let liquidationPrice = 0
  if (entryPrice > 0 && leverage > 0) {
    if (direction === 'long') {
      liquidationPrice = entryPrice * (1 - 1 / leverage + 0.001)
    } else {
      liquidationPrice = entryPrice * (1 + 1 / leverage - 0.001)
    }
  }

  const leverageOptions = [1, 2, 5, 10, 25]

  const handleOpen = async () => {
    if (parsedMargin <= 0) {
      setError('Please enter a valid margin amount')
      return
    }
    if (totalCost > balance) {
      setError('Insufficient balance')
      return
    }
    setError('')
    try {
      const tp = tpInput ? parseFloat(tpInput) : null
      const sl = slInput ? parseFloat(slInput) : null
      const result = await openFuturesPosition(crypto.symbol, direction, leverage, parsedMargin, tp, sl)
      setMarginInput('')
      setTpInput('')
      setSlInput('')
      if (result.feedback) setTradeFeedback(result.feedback)
      onTradeComplete()
      loadFuturesData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleClose = async (positionId) => {
    setError('')
    try {
      const result = await closeFuturesPosition(positionId)
      if (result.feedback) setTradeFeedback(result.feedback)
      onTradeComplete()
      loadFuturesData()
    } catch (err) {
      setError(err.message)
    }
  }

  const startEditOrders = (pos) => {
    setEditingOrders(pos.id)
    setEditTp(pos.takeProfit ? String(pos.takeProfit) : '')
    setEditSl(pos.stopLoss ? String(pos.stopLoss) : '')
    setEditError('')
  }

  const cancelEditOrders = () => {
    setEditingOrders(null)
    setEditTp('')
    setEditSl('')
    setEditError('')
  }

  const saveEditOrders = async (positionId) => {
    setEditError('')
    try {
      const tp = editTp ? parseFloat(editTp) : null
      const sl = editSl ? parseFloat(editSl) : null
      await updateFuturesOrders(positionId, tp, sl)
      setEditingOrders(null)
      loadFuturesData()
    } catch (err) {
      setEditError(err.message)
    }
  }

  return (
    <>
      {/* Triggered Events */}
      {triggeredEvents.length > 0 && (
        <div className="sim-triggered-alerts">
          {triggeredEvents.map((ev, i) => (
            <div key={i} className="sim-triggered-alert">
              <span>
                {ev.reason === 'liquidation' ? 'Liquidated' : ev.reason === 'take-profit' ? 'Take-profit hit' : 'Stop-loss hit'}:
                {' '}{ev.direction.toUpperCase()} {ev.crypto} closed at ${ev.closePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                {' '}({ev.pnl >= 0 ? '+' : ''}{ev.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})
              </span>
              <button onClick={() => setTriggeredEvents(prev => prev.filter((_, idx) => idx !== i))}>Dismiss</button>
            </div>
          ))}
        </div>
      )}

      {/* Crypto Selector */}
      <div className="sim-crypto-selector">
        {cryptoList.map((c, i) => (
          <button
            key={c.symbol}
            className={`sim-crypto-btn ${selectedCrypto === i ? 'active' : ''}`}
            onClick={() => setSelectedCrypto(i)}
          >
            <span className="sim-crypto-icon">{c.icon}</span>
            <span className="sim-crypto-name">{c.name}</span>
          </button>
        ))}
      </div>

      {/* Main Content: Chart + Sidebar */}
      <div className="sim-main">
        {/* Chart Area */}
        <div className="sim-chart-area">
          <div className="sim-chart-header">
            <div>
              <h3>{crypto.name} <span className="sim-symbol">{crypto.symbol}</span></h3>
              <p className="sim-price">${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <span className={`sim-change ${crypto.change >= 0 ? 'up' : 'down'}`}>
                {crypto.change >= 0 ? '▲' : '▼'} {Math.abs(crypto.change)}%
              </span>
            </div>
          </div>
          <PriceChart symbol={crypto.symbol} currentPrice={crypto.price} priceChange={crypto.change} />
        </div>

        {/* Right Sidebar */}
        <div className="sim-sidebar">
          <div className="sim-sidebar-tabs">
            <button className={rightTab === 'positions' ? 'active' : ''} onClick={() => setRightTab('positions')}>Positions</button>
            <button className={rightTab === 'history' ? 'active' : ''} onClick={() => setRightTab('history')}>History</button>
          </div>

          {rightTab === 'positions' ? (
            <div className="sim-portfolio-list">
              {positions.length === 0 && <p style={{ padding: 12, color: '#888' }}>No open positions</p>}
              {positions.map((pos) => (
                <div key={pos.id} className="sim-futures-position">
                  <div className="sim-futures-pos-header">
                    <div className="sim-futures-pos-left">
                      <span className={`sim-futures-dir-badge ${pos.direction}`}>
                        {pos.direction.toUpperCase()}
                      </span>
                      <span className="sim-futures-pos-crypto">{pos.crypto}</span>
                      <span className="sim-futures-pos-lev">{pos.leverage}x</span>
                    </div>
                    <button className="sim-futures-close-btn" onClick={() => handleClose(pos.id)}>Close</button>
                  </div>
                  <div className="sim-futures-pos-details">
                    <div className="sim-futures-pos-row">
                      <span>Entry</span>
                      <span>${pos.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="sim-futures-pos-row">
                      <span>Mark</span>
                      <span>${pos.markPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="sim-futures-pos-row">
                      <span>Margin</span>
                      <span>${pos.margin.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="sim-futures-pos-row">
                      <span>Liq. Price</span>
                      <span>${pos.liquidationPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {editingOrders === pos.id ? (
                      <div className="sim-futures-edit-orders">
                        <div className="sim-futures-edit-row">
                          <label>TP</label>
                          <input
                            type="number"
                            placeholder={pos.direction === 'long' ? 'Above entry' : 'Below entry'}
                            value={editTp}
                            onChange={(e) => setEditTp(e.target.value)}
                          />
                        </div>
                        <div className="sim-futures-edit-row">
                          <label>SL</label>
                          <input
                            type="number"
                            placeholder={pos.direction === 'long' ? 'Below entry' : 'Above entry'}
                            value={editSl}
                            onChange={(e) => setEditSl(e.target.value)}
                          />
                        </div>
                        {editError && <p className="sim-trade-error" style={{ margin: '4px 0', fontSize: '0.75rem' }}>{editError}</p>}
                        <div className="sim-futures-edit-actions">
                          <button className="sim-futures-edit-save" onClick={() => saveEditOrders(pos.id)}>Save</button>
                          <button className="sim-futures-edit-cancel" onClick={cancelEditOrders}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="sim-futures-pos-row">
                          <span>TP</span>
                          <span className="sim-futures-pos-clickable" onClick={() => startEditOrders(pos)}>
                            {pos.takeProfit ? `$${pos.takeProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'} <span className="sim-futures-edit-icon">&#9998;</span>
                          </span>
                        </div>
                        <div className="sim-futures-pos-row">
                          <span>SL</span>
                          <span className="sim-futures-pos-clickable" onClick={() => startEditOrders(pos)}>
                            {pos.stopLoss ? `$${pos.stopLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'} <span className="sim-futures-edit-icon">&#9998;</span>
                          </span>
                        </div>
                      </>
                    )}
                    <div className="sim-futures-pos-row">
                      <span>Unrealized P&L</span>
                      <span className={`sim-futures-pnl ${pos.unrealizedPnl >= 0 ? 'profit' : 'loss'}`}>
                        {pos.unrealizedPnl >= 0 ? '+' : ''}{pos.unrealizedPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        {' '}({pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sim-portfolio-list">
              {transactions.length === 0 && <div className="sim-history-empty"><p>No futures history yet</p></div>}
              {transactions.slice(historyPage * 10, historyPage * 10 + 10).map((t) => (
                <div key={t.id} className="sim-holding">
                  <div className="sim-holding-left">
                    <span className="sim-holding-symbol" style={{ color: t.type === 'open' ? '#375bbd' : t.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                      {t.type.toUpperCase()}
                      <span className={`sim-futures-dir-badge small ${t.direction}`}>{t.direction === 'long' ? 'L' : 'S'}</span>
                    </span>
                    <span className="sim-holding-amount">{t.crypto} {t.leverage}x</span>
                  </div>
                  <div className="sim-holding-right">
                    <span className="sim-holding-value">${t.margin.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    {t.type !== 'open' && (
                      <span className={`sim-holding-change ${t.pnl >= 0 ? 'up' : 'down'}`}>
                        {t.pnl >= 0 ? '+' : ''}{t.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {transactions.length > 10 && (
                <div className="sim-pagination">
                  <button disabled={historyPage === 0} onClick={() => setHistoryPage(p => p - 1)}>Prev</button>
                  <span>{historyPage + 1} / {Math.ceil(transactions.length / 10)}</span>
                  <button disabled={historyPage >= Math.ceil(transactions.length / 10) - 1} onClick={() => setHistoryPage(p => p + 1)}>Next</button>
                </div>
              )}
            </div>
          )}

          {/* Trade Form */}
          <div className="sim-trade-panel">
            <div className="sim-futures-direction-toggle">
              <button
                className={`sim-futures-dir-btn long ${direction === 'long' ? 'active' : ''}`}
                onClick={() => setDirection('long')}
              >
                Long
              </button>
              <button
                className={`sim-futures-dir-btn short ${direction === 'short' ? 'active' : ''}`}
                onClick={() => setDirection('short')}
              >
                Short
              </button>
            </div>

            <div className="sim-trade-form">
              {/* Leverage Selector */}
              <div className="sim-tip-label" onClick={() => setExpandedTip(expandedTip === 'leverage' ? null : 'leverage')}>
                <label>Leverage</label>
                <span className={`sim-tip-arrow ${expandedTip === 'leverage' ? 'open' : ''}`}>&#9662;</span>
              </div>
              {expandedTip === 'leverage' && (
                <div className="sim-tip-box">
                  Leverage multiplies your position size. With 10x leverage, a $100 margin controls a $1,000 position. Higher leverage means bigger potential gains — but also bigger losses and a closer liquidation price. Beginners should start with 1x-5x.
                </div>
              )}
              <div className="sim-futures-leverage-row">
                {leverageOptions.map((lev) => (
                  <button
                    key={lev}
                    className={`sim-futures-lev-btn ${leverage === lev ? 'active' : ''}`}
                    onClick={() => setLeverage(lev)}
                  >
                    {lev}x
                  </button>
                ))}
              </div>

              {/* Margin Input */}
              <div className="sim-tip-label" onClick={() => setExpandedTip(expandedTip === 'margin' ? null : 'margin')}>
                <label>Margin (USD)</label>
                <span className={`sim-tip-arrow ${expandedTip === 'margin' ? 'open' : ''}`}>&#9662;</span>
              </div>
              {expandedTip === 'margin' && (
                <div className="sim-tip-box">
                  Margin is the amount of your own money you put up as collateral. It's NOT the full position size — leverage multiplies it. For example, $100 margin at 10x leverage = $1,000 position. If the trade goes against you, you can lose your entire margin. A 0.1% fee is charged on the full position size when opening and closing.
                </div>
              )}
              <input
                type="number"
                placeholder="0.00"
                value={marginInput}
                onChange={(e) => { setMarginInput(e.target.value); setError('') }}
              />

              {/* Margin Slider */}
              <div className="sim-slider-wrap">
                <input
                  type="range"
                  min="0"
                  max={balance}
                  step={1}
                  value={parsedMargin > balance ? balance : parsedMargin}
                  onChange={(e) => { const v = parseFloat(e.target.value); setMarginInput(v > 0 ? v.toFixed(0) : ''); setError('') }}
                  className="sim-amount-slider"
                />
                <div className="sim-slider-labels">
                  <span>$0</span>
                  <span>${balance.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                </div>
              </div>

              {/* TP/SL Inputs */}
              <div className="sim-tip-label" onClick={() => setExpandedTip(expandedTip === 'tp' ? null : 'tp')}>
                <label>Take Profit (USD) <span style={{ fontWeight: 400, textTransform: 'none' }}>— optional</span></label>
                <span className={`sim-tip-arrow ${expandedTip === 'tp' ? 'open' : ''}`}>&#9662;</span>
              </div>
              {expandedTip === 'tp' && (
                <div className="sim-tip-box">
                  Take Profit automatically closes your position when the price reaches your target, locking in your gains. For long positions, set it above the entry price. For short positions, set it below. Without a TP, you must close manually.
                </div>
              )}
              <input
                type="number"
                placeholder={direction === 'long' ? `Above $${entryPrice.toLocaleString()}` : `Below $${entryPrice.toLocaleString()}`}
                value={tpInput}
                onChange={(e) => setTpInput(e.target.value)}
              />

              <div className="sim-tip-label" onClick={() => setExpandedTip(expandedTip === 'sl' ? null : 'sl')}>
                <label>Stop Loss (USD) <span style={{ fontWeight: 400, textTransform: 'none' }}>— optional</span></label>
                <span className={`sim-tip-arrow ${expandedTip === 'sl' ? 'open' : ''}`}>&#9662;</span>
              </div>
              {expandedTip === 'sl' && (
                <div className="sim-tip-box">
                  Stop Loss automatically closes your position if the price moves against you, limiting your losses. For long positions, set it below the entry price. For short positions, set it above. It's highly recommended to always set a stop loss to protect your margin.
                </div>
              )}
              <input
                type="number"
                placeholder={direction === 'long' ? `Below $${entryPrice.toLocaleString()}` : `Above $${entryPrice.toLocaleString()}`}
                value={slInput}
                onChange={(e) => setSlInput(e.target.value)}
              />

              {/* Preview */}
              <div className="sim-order-details">
                <div className="sim-order-row"><span>Entry Price</span><span>${entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                <div className="sim-order-row"><span>Position Size</span><span>{positionSize.toFixed(6)} {crypto.symbol}</span></div>
                <div className="sim-order-row"><span>Notional Value</span><span>${notional.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                <div className="sim-order-row"><span>Liq. Price</span><span>${liquidationPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                <div className="sim-order-row"><span>Fee (0.1%)</span><span>${fee.toFixed(2)}</span></div>
                <div className="sim-order-divider" />
                <div className="sim-order-row total"><span>Total Cost</span><span>${totalCost.toFixed(2)}</span></div>
              </div>

              {error && <p className="sim-trade-error">{error}</p>}
              <button
                className={`sim-trade-btn ${direction === 'long' ? 'buy' : 'sell'}`}
                onClick={handleOpen}
              >
                Open {direction === 'long' ? 'Long' : 'Short'} {crypto.symbol}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Tips */}
      <div className="sim-tips">
        <h4>Futures Trading Tips</h4>
        <ul>
          <li>Start with low leverage (1x-5x) to understand how futures work</li>
          <li>Always set stop-loss orders to protect against liquidation</li>
          <li>Your margin is at risk — never commit more than you can afford to lose</li>
          <li>Short positions profit when the price goes down</li>
        </ul>
      </div>

      {/* Trade Feedback Modal */}
      <TradeFeedback feedback={tradeFeedback} onClose={() => setTradeFeedback(null)} />
    </>
  )
}
