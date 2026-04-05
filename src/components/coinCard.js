/**
 * Coin Card Component
 * Renders a compact card for the coin grid on the landing page
 */

import { sanitize, formatPrice, formatPercent } from '../utils/security.js';

/**
 * Draw a sparkline SVG from price data
 * @param {number[]} prices
 * @param {string} color
 * @returns {string} SVG html string
 */
function drawSparkline(prices, color) {
    if (!prices || prices.length < 2) {
        return '<svg class="coin-card__sparkline" viewBox="0 0 100 40"></svg>';
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const step = 100 / (prices.length - 1);
    const points = prices.map((p, i) => {
        const x = i * step;
        const y = 38 - ((p - min) / range) * 36;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathData = `M${points.join(' L')}`;
    const areaPath = `${pathData} L100,40 L0,40 Z`;

    return `<svg class="coin-card__sparkline" viewBox="0 0 100 40" preserveAspectRatio="none">
    <defs>
      <linearGradient id="sparkFill_${color.replace('#', '')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#sparkFill_${color.replace('#', '')})" />
    <path d="${pathData}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

/**
 * Create a coin card element
 * @param {Object} prediction - Prediction data from engine
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement}
 */
export function createCoinCard(prediction, onClick) {
    const card = document.createElement('div');
    card.className = 'coin-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `View ${prediction.name} details`);
    card.id = `card-${prediction.coinId}`;

    const changeClass = prediction.change24h >= 0 ? 'coin-card__change--up' : 'coin-card__change--down';
    const changeArrow = prediction.change24h >= 0 ? '▲' : '▼';
    const sparkColor = prediction.change24h >= 0 ? '#10b981' : '#ef4444';

    card.innerHTML = `
    <div class="coin-card__header">
      <div class="coin-card__info">
        <img class="coin-card__icon" 
             src="${sanitize(prediction.image)}" 
             alt="${sanitize(prediction.name)}" 
             loading="lazy"
             onerror="this.style.display='none'" />
        <div>
          <div class="coin-card__name">${sanitize(prediction.name)}</div>
          <div class="coin-card__symbol">${sanitize(prediction.symbol)}</div>
        </div>
      </div>
      <span class="status-badge status-badge--${prediction.status}">
        ${prediction.status === 'profitable' ? '🟢' : prediction.status === 'risky' ? '🔴' : '🟡'}
        ${sanitize(prediction.statusLabel)}
      </span>
    </div>
    <div class="coin-card__price">${formatPrice(prediction.currentPrice)}</div>
    <div class="coin-card__change ${changeClass}">
      <span>${changeArrow}</span>
      <span>${formatPercent(prediction.change24h)} (24h)</span>
    </div>
    ${drawSparkline(prediction.sparkline, sparkColor)}
    <div class="coin-card__footer">
      <div class="coin-card__stat">
        <span class="coin-card__stat-label">Volume 24h</span>
        <span class="coin-card__stat-value">${formatCompact(prediction.volume)}</span>
      </div>
      <div class="coin-card__stat">
        <span class="coin-card__stat-label">Market Cap</span>
        <span class="coin-card__stat-value">${formatCompact(prediction.marketCap)}</span>
      </div>
      <div class="coin-card__stat">
        <span class="coin-card__stat-label">Confidence</span>
        <span class="coin-card__stat-value">${sanitize(prediction.confidenceLabel)}</span>
      </div>
    </div>
  `;

    card.addEventListener('click', () => onClick(prediction));
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(prediction);
        }
    });

    return card;
}

function formatCompact(num) {
    if (typeof num !== 'number' || isNaN(num)) return '--';
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
}
