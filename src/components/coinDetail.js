/**
 * Coin Detail Component
 * Renders the detailed modal view with trading recommendations
 */

import { sanitize, formatPrice, formatPercent, formatNumber } from '../utils/security.js';

/**
 * Render the detail modal content
 * @param {Object} prediction - Full prediction object
 * @param {Function} onViewNews - Callback to open news panel
 * @returns {string} HTML string (sanitized)
 */
export function renderCoinDetail(prediction, onViewNews) {
    const changeClass = prediction.change24h >= 0 ? 'coin-card__change--up' : 'coin-card__change--down';
    const changeArrow = prediction.change24h >= 0 ? '▲' : '▼';

    const container = document.createElement('div');

    // Header
    container.innerHTML = `
    <div class="modal__coin-header">
      <img class="modal__coin-icon" 
           src="${sanitize(prediction.image)}" 
           alt="${sanitize(prediction.name)}" 
           onerror="this.style.display='none'" />
      <div>
        <div class="modal__coin-name">${sanitize(prediction.name)}</div>
        <div class="modal__coin-symbol">${sanitize(prediction.symbol)} / USDT</div>
      </div>
      <span class="status-badge status-badge--${prediction.status}" style="margin-left:auto;">
        ${prediction.status === 'profitable' ? '🟢' : prediction.status === 'risky' ? '🔴' : '🟡'}
        ${sanitize(prediction.statusLabel)}
      </span>
    </div>

    <div class="modal__price-row">
      <span class="modal__price">${formatPrice(prediction.currentPrice)}</span>
      <span class="modal__change ${changeClass}">${changeArrow} ${formatPercent(prediction.change24h)}</span>
    </div>

    <!-- 24h Stats -->
    <div class="modal__stats">
      <div class="modal__stat">
        <div class="modal__stat-label">24h High</div>
        <div class="modal__stat-value" style="color:var(--green)">${formatPrice(prediction.high24h)}</div>
      </div>
      <div class="modal__stat">
        <div class="modal__stat-label">24h Low</div>
        <div class="modal__stat-value" style="color:var(--red)">${formatPrice(prediction.low24h)}</div>
      </div>
      <div class="modal__stat">
        <div class="modal__stat-label">24h Volume</div>
        <div class="modal__stat-value">${formatCompact(prediction.volume)}</div>
      </div>
      <div class="modal__stat">
        <div class="modal__stat-label">Market Cap</div>
        <div class="modal__stat-value">${formatCompact(prediction.marketCap)}</div>
      </div>
      <div class="modal__stat">
        <div class="modal__stat-label">All-time High</div>
        <div class="modal__stat-value">${formatPrice(prediction.ath)}</div>
      </div>
      <div class="modal__stat">
        <div class="modal__stat-label">From ATH</div>
        <div class="modal__stat-value" style="color:var(--red)">${formatPercent(prediction.athChangePercent)}</div>
      </div>
    </div>

    <!-- Long Trade -->
    <div class="trade-section">
      <div class="trade-section__title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2">
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
        Trading Recommendations
      </div>
      
      <div class="trade-card trade-card--long">
        <div class="trade-card__header">
          <span class="trade-card__type trade-card__type--long">📈 Long Trade (Buy)</span>
          <span class="confidence-badge confidence-badge--${prediction.confidence}">${sanitize(prediction.confidenceLabel)} Confidence</span>
        </div>
        <div class="trade-card__grid">
          <div class="trade-card__item">
            <div class="trade-card__item-label">Entry Price</div>
            <div class="trade-card__item-value trade-card__item-value--green">${formatPrice(prediction.longTrade.entry)}</div>
          </div>
          <div class="trade-card__item">
            <div class="trade-card__item-label">Target (Take Profit)</div>
            <div class="trade-card__item-value trade-card__item-value--green">${formatPrice(prediction.longTrade.target)}</div>
          </div>
          <div class="trade-card__item">
            <div class="trade-card__item-label">Stop Loss</div>
            <div class="trade-card__item-value trade-card__item-value--red">${formatPrice(prediction.longTrade.stopLoss)}</div>
          </div>
        </div>
        <div style="margin-top:12px; font-size:0.75rem; color:var(--text-muted);">
          Potential Gain: <span style="color:var(--green)">${formatPercent(prediction.longTrade.potentialGain)}</span> &nbsp;|&nbsp;
          Risk: <span style="color:var(--red)">${formatPercent(prediction.longTrade.potentialLoss)}</span>
        </div>
      </div>

      <!-- Short Trade -->
      <div class="trade-card trade-card--short">
        <div class="trade-card__header">
          <span class="trade-card__type trade-card__type--short">📉 Short Trade (Sell)</span>
          <span class="confidence-badge confidence-badge--${prediction.confidence}">${sanitize(prediction.confidenceLabel)} Confidence</span>
        </div>
        <div class="trade-card__grid">
          <div class="trade-card__item">
            <div class="trade-card__item-label">Entry Price</div>
            <div class="trade-card__item-value trade-card__item-value--red">${formatPrice(prediction.shortTrade.entry)}</div>
          </div>
          <div class="trade-card__item">
            <div class="trade-card__item-label">Target (Take Profit)</div>
            <div class="trade-card__item-value trade-card__item-value--green">${formatPrice(prediction.shortTrade.target)}</div>
          </div>
          <div class="trade-card__item">
            <div class="trade-card__item-label">Stop Loss</div>
            <div class="trade-card__item-value trade-card__item-value--red">${formatPrice(prediction.shortTrade.stopLoss)}</div>
          </div>
        </div>
        <div style="margin-top:12px; font-size:0.75rem; color:var(--text-muted);">
          Potential Gain: <span style="color:var(--green)">${formatPercent(prediction.shortTrade.potentialGain)}</span> &nbsp;|&nbsp;
          Risk: <span style="color:var(--red)">${formatPercent(prediction.shortTrade.potentialLoss)}</span>
        </div>
      </div>
    </div>

    <!-- Technical Indicators -->
    ${renderIndicators(prediction.indicators)}

    <!-- Actions -->
    <div class="modal__actions">
      <button class="btn btn--news" id="btnViewNews">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2"/>
        </svg>
        View News
      </button>
      <a class="btn btn--outline" href="https://www.coingecko.com/en/coins/${sanitize(prediction.coinId)}" target="_blank" rel="noopener noreferrer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
        </svg>
        CoinGecko
      </a>
    </div>

    <div style="margin-top:16px; padding:12px; background:var(--bg-card); border-radius:var(--radius-sm); font-size:0.72rem; color:var(--text-muted); border:1px solid var(--border);">
      ⚠️ <strong>Not financial advice.</strong> Predictions are generated from technical analysis indicators (RSI, SMA, EMA, MACD, Bollinger Bands) applied to 30-day historical data. 
      Crypto markets are extremely volatile. Always DYOR and never invest more than you can afford to lose.
      <br/><em>Last analysis: ${new Date(prediction.lastUpdated).toLocaleString()}</em>
    </div>
  `;

    // Attach news button handler
    const newsBtn = container.querySelector('#btnViewNews');
    if (newsBtn) {
        newsBtn.addEventListener('click', () => onViewNews(prediction));
    }

    return container;
}

function renderIndicators(indicators) {
    if (!indicators || !indicators.rsi) {
        return '<div class="indicators"><p style="color:var(--text-muted);font-size:0.85rem;">Indicator data unavailable.</p></div>';
    }

    const signalClass = (sig) => {
        if (sig === 'buy') return 'signal--buy';
        if (sig === 'sell') return 'signal--sell';
        return 'signal--neutral';
    };

    const signalLabel = (sig) => {
        if (sig === 'buy') return '▲ Buy Signal';
        if (sig === 'sell') return '▼ Sell Signal';
        return '● Neutral';
    };

    return `
    <div class="indicators">
      <div class="indicators__title">Technical Indicators</div>
      <div class="indicators__grid">
        <div class="indicator-chip">
          <span class="indicator-chip__name">RSI (14)</span>
          <span class="indicator-chip__value">${indicators.rsi.value.toFixed(1)}</span>
          <span class="indicator-chip__signal ${signalClass(indicators.rsi.signal)}">${signalLabel(indicators.rsi.signal)}</span>
        </div>
        <div class="indicator-chip">
          <span class="indicator-chip__name">SMA 20/50</span>
          <span class="indicator-chip__value">${formatPrice(indicators.sma.sma20)}</span>
          <span class="indicator-chip__signal ${signalClass(indicators.sma.signal)}">${signalLabel(indicators.sma.signal)}</span>
        </div>
        <div class="indicator-chip">
          <span class="indicator-chip__name">EMA 12/26</span>
          <span class="indicator-chip__value">${formatPrice(indicators.ema.ema12)}</span>
          <span class="indicator-chip__signal ${signalClass(indicators.ema.signal)}">${signalLabel(indicators.ema.signal)}</span>
        </div>
        <div class="indicator-chip">
          <span class="indicator-chip__name">MACD</span>
          <span class="indicator-chip__value">${indicators.macd.macd.toFixed(4)}</span>
          <span class="indicator-chip__signal ${signalClass(indicators.macd.signal)}">${signalLabel(indicators.macd.signal)}</span>
        </div>
        <div class="indicator-chip">
          <span class="indicator-chip__name">Bollinger Band</span>
          <span class="indicator-chip__value">BW: ${indicators.bollingerBands.bandwidth.toFixed(1)}%</span>
          <span class="indicator-chip__signal ${signalClass(indicators.bollingerBands.signal)}">${signalLabel(indicators.bollingerBands.signal)}</span>
        </div>
      </div>
    </div>
  `;
}

function formatCompact(num) {
    if (typeof num !== 'number' || isNaN(num)) return '--';
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
}
