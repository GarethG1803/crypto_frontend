import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import PriceChart from '../components/PriceChart'
import TradeFeedback from '../components/TradeFeedback'
import FuturesTrading from '../components/FuturesTrading'
import { getPortfolio, executeTrade, getHistory, setStopLoss } from '../services/api'

export default function Simulator() {
  const [mode, setMode] = useState('spot')
  const [portfolio, setPortfolio] = useState({ balance: 10000, holdings: [], prices: {}, portfolioValue: 0, totalValue: 10000, pnl: 0, pnlPercent: 0, stopLosses: {}, triggeredStopLosses: [] })
  const [transactions, setTransactions] = useState([])
  const [selectedCrypto, setSelectedCrypto] = useState(0)
  const [tradeTab, setTradeTab] = useState('buy')
  const [amount, setAmount] = useState('')
  const [rightTab, setRightTab] = useState('portfolio')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tradeFeedback, setTradeFeedback] = useState(null)
  const [stopLossPrice, setStopLossPrice] = useState('')
  const [stopLossEnabled, setStopLossEnabled] = useState(false)
  const [triggeredAlerts, setTriggeredAlerts] = useState([])
  const [historyPage, setHistoryPage] = useState(0)

  const loadData = () => {
    Promise.all([getPortfolio(), getHistory()])
      .then(([p, h]) => {
        setPortfolio(p)
        setTransactions(h)
        if (p.triggeredStopLosses && p.triggeredStopLosses.length > 0) {
          setTriggeredAlerts(p.triggeredStopLosses)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const cryptoList = Object.entries(portfolio.prices || {}).map(([symbol, data]) => ({
    symbol, ...data,
  }))

  const crypto = cryptoList[selectedCrypto] || { symbol: 'BTC', name: 'Bitcoin', price: 0, change: 0, icon: '₿' }
  const holding = portfolio.holdings.find(h => h.symbol === crypto.symbol)
  const maxBuy = crypto.price > 0 ? portfolio.balance / (crypto.price * 1.001) : 0
  const maxSell = holding ? holding.amount : 0
  const maxAmount = tradeTab === 'buy' ? maxBuy : maxSell
  const sliderStep = crypto.price >= 10000 ? 0.00001 : crypto.price >= 100 ? 0.001 : crypto.price >= 1 ? 0.1 : 10

  const parsedAmount = parseFloat(amount) || 0
  const usdValue = (parsedAmount * crypto.price).toFixed(2)
  const fee = (parsedAmount * crypto.price * 0.001).toFixed(2)
  const total = (parseFloat(usdValue) + parseFloat(fee)).toFixed(2)
  const pnl = portfolio.pnl || 0
  const pnlPercent = portfolio.pnlPercent || 0

  const handleAmountChange = (val) => {
    setAmount(val)
    setError('')
  }

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value)
    // Round to reasonable decimals based on step
    const decimals = crypto.price >= 10000 ? 5 : crypto.price >= 100 ? 3 : crypto.price >= 1 ? 1 : 0
    setAmount(val > 0 ? val.toFixed(decimals) : '')
    setError('')
  }

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }
    setError('')
    try {
      const sl = (tradeTab === 'buy' && stopLossEnabled && stopLossPrice) ? parseFloat(stopLossPrice) : null
      const result = await executeTrade(crypto.symbol, tradeTab, parseFloat(amount), sl)
      setAmount('')
      setStopLossPrice('')
      setStopLossEnabled(false)
      if (result.feedback) {
        setTradeFeedback(result.feedback)
      }
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSellAll = async (symbol) => {
    const h = portfolio.holdings.find(h => h.symbol === symbol)
    if (!h || h.amount <= 0) return
    setError('')
    try {
      const result = await executeTrade(symbol, 'sell', h.amount)
      if (result.feedback) setTradeFeedback(result.feedback)
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSellAllHoldings = async () => {
    if (portfolio.holdings.length === 0) return
    setError('')
    try {
      for (const h of portfolio.holdings) {
        if (h.amount > 0) {
          await executeTrade(h.symbol, 'sell', h.amount)
        }
      }
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRemoveStopLoss = async (symbol) => {
    try {
      await setStopLoss(symbol, null)
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <Layout><p>Loading...</p></Layout>

  return (
    <Layout>
      {/* Mode Toggle */}
      <div className="sim-mode-toggle">
        <button className={`sim-mode-btn ${mode === 'spot' ? 'active' : ''}`} onClick={() => setMode('spot')}>Spot Trading</button>
        <button className={`sim-mode-btn ${mode === 'futures' ? 'active' : ''}`} onClick={() => setMode('futures')}>Futures Trading</button>
      </div>

      {/* Stats Row */}
      <div className="sim-stats">
        <div className="sim-stat-card">
          <span className="sim-stat-label">Cash Balance</span>
          <span className="sim-stat-value">${portfolio.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="sim-stat-card">
          <span className="sim-stat-label">Portfolio Value</span>
          <span className="sim-stat-value">${(portfolio.portfolioValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="sim-stat-card">
          <span className="sim-stat-label">Total Value</span>
          <span className="sim-stat-value">${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="sim-stat-card">
          <span className="sim-stat-label">Profit / Loss</span>
          <span className={`sim-stat-value ${pnl >= 0 ? 'sim-profit' : 'sim-loss'}`}>
            {pnl >= 0 ? '+' : ''}{pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            <span className="sim-pnl-pct"> ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)</span>
          </span>
        </div>
      </div>

      {mode === 'futures' && (
        <FuturesTrading prices={portfolio.prices} balance={portfolio.balance} onTradeComplete={loadData} />
      )}

      {mode === 'spot' && <>
      {/* Stop-Loss Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="sim-triggered-alerts">
          {triggeredAlerts.map((sl, i) => (
            <div key={i} className="sim-triggered-alert">
              <span>Stop-loss triggered: Sold {sl.amount} {sl.symbol} at ${sl.executedPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} (stop was ${sl.stopPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
              <button onClick={() => setTriggeredAlerts(prev => prev.filter((_, idx) => idx !== i))}>Dismiss</button>
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
            <button className={rightTab === 'portfolio' ? 'active' : ''} onClick={() => setRightTab('portfolio')}>Portfolio</button>
            <button className={rightTab === 'history' ? 'active' : ''} onClick={() => setRightTab('history')}>History</button>
          </div>

          {rightTab === 'portfolio' ? (
            <div className="sim-portfolio-list">
              {portfolio.holdings.length === 0 && <p style={{padding:12,color:'#888'}}>No holdings yet</p>}
              {portfolio.holdings.length > 0 && (
                <div className="sim-sell-all-bar">
                  <button className="sim-sell-all-btn" onClick={handleSellAllHoldings}>Sell All Holdings</button>
                </div>
              )}
              {portfolio.holdings.map((h) => (
                <div key={h.symbol} className="sim-holding">
                  <div className="sim-holding-left">
                    <span className="sim-holding-symbol">{h.symbol}</span>
                    <span className="sim-holding-amount">{h.amount} {h.symbol}</span>
                    {h.stopLoss && (
                      <span className="sim-holding-stoploss">
                        SL: ${h.stopLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <button className="sim-sl-remove" onClick={() => handleRemoveStopLoss(h.symbol)} title="Remove stop-loss">x</button>
                      </span>
                    )}
                  </div>
                  <div className="sim-holding-right">
                    <span className="sim-holding-value">${h.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    <span className={`sim-holding-change ${(h.pnl || 0) >= 0 ? 'up' : 'down'}`}>
                      {(h.pnl || 0) >= 0 ? '+' : ''}{(h.pnl || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                    <button className="sim-sell-one-btn" onClick={() => handleSellAll(h.symbol)}>Sell</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sim-portfolio-list">
              {transactions.length === 0 && <div className="sim-history-empty"><p>No trading history yet</p></div>}
              {transactions.slice(historyPage * 10, historyPage * 10 + 10).map((t) => (
                <div key={t.id} className="sim-holding">
                  <div className="sim-holding-left">
                    <span className="sim-holding-symbol" style={{color: t.type === 'buy' ? '#22c55e' : '#ef4444'}}>
                      {t.type.toUpperCase()}
                      {t.triggeredBy === 'stop-loss' && <span className="sim-sl-badge">SL</span>}
                    </span>
                    <span className="sim-holding-amount">{t.amount} {t.crypto}</span>
                  </div>
                  <div className="sim-holding-right">
                    <span className="sim-holding-value">${t.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
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

          {/* Buy/Sell Panel */}
          <div className="sim-trade-panel">
            <div className="sim-trade-tabs">
              <button className={tradeTab === 'buy' ? 'active buy' : ''} onClick={() => setTradeTab('buy')}>Buy</button>
              <button className={tradeTab === 'sell' ? 'active sell' : ''} onClick={() => setTradeTab('sell')}>Sell</button>
            </div>

            <div className="sim-trade-form">
              <label>Amount ({crypto.symbol})</label>
              <input
                type="number"
                placeholder={`0.00 ${crypto.symbol}`}
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
              />

              {/* Amount Slider */}
              <div className="sim-slider-wrap">
                <input
                  type="range"
                  min="0"
                  max={maxAmount}
                  step={sliderStep}
                  value={parsedAmount > maxAmount ? maxAmount : parsedAmount}
                  onChange={handleSliderChange}
                  className="sim-amount-slider"
                />
                <div className="sim-slider-labels">
                  <span>0</span>
                  <span>{maxAmount > 0 ? maxAmount.toFixed(crypto.price >= 10000 ? 5 : crypto.price >= 100 ? 3 : 1) : '0'} {crypto.symbol}</span>
                </div>
              </div>

              {/* Stop-Loss (buy only) */}
              {tradeTab === 'buy' && (
                <div className="sim-stoploss-section">
                  <label className="sim-stoploss-toggle">
                    <input
                      type="checkbox"
                      checked={stopLossEnabled}
                      onChange={(e) => setStopLossEnabled(e.target.checked)}
                    />
                    <span>Set Stop-Loss</span>
                  </label>
                  {stopLossEnabled && (
                    <input
                      type="number"
                      placeholder={`Stop-loss price (USD)`}
                      value={stopLossPrice}
                      onChange={(e) => setStopLossPrice(e.target.value)}
                      className="sim-stoploss-input"
                    />
                  )}
                </div>
              )}

              <div className="sim-order-details">
                <div className="sim-order-row"><span>Price</span><span>${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                <div className="sim-order-row"><span>Value</span><span>${usdValue}</span></div>
                <div className="sim-order-row"><span>Fee (0.1%)</span><span>${fee}</span></div>
                {tradeTab === 'buy' && stopLossEnabled && stopLossPrice && (
                  <div className="sim-order-row"><span>Stop-Loss</span><span>${parseFloat(stopLossPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                )}
                <div className="sim-order-divider" />
                <div className="sim-order-row total"><span>Total</span><span>${total}</span></div>
              </div>

              {error && <p className="sim-trade-error">{error}</p>}
              <button className={`sim-trade-btn ${tradeTab}`} onClick={handleTrade}>
                {tradeTab === 'buy' ? `Buy ${crypto.symbol}` : `Sell ${crypto.symbol}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Tips */}
      <div className="sim-tips">
        <h4>Trading Tips</h4>
        <ul>
          <li>Start with small amounts to understand market movements</li>
          <li>Diversify your portfolio across different cryptocurrencies</li>
          <li>Don't invest more than you can afford to lose</li>
          <li>Use the simulator to practice strategies before real trading</li>
        </ul>
      </div>

      {/* Trade Feedback Modal */}
      <TradeFeedback feedback={tradeFeedback} onClose={() => setTradeFeedback(null)} />
      </>}
    </Layout>
  )
}
