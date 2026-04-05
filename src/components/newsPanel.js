/**
 * News Panel Component
 * Renders a slide-in panel with coin-specific news
 */

import { fetchCoinNews } from '../api/news.js';
import { sanitize, sanitizeUrl, formatRelativeTime } from '../utils/security.js';

/**
 * Open the news panel for a specific coin
 * @param {Object} prediction - Coin prediction data
 */
export async function openNewsPanel(prediction) {
    const panel = document.getElementById('newsPanel');
    const title = document.getElementById('newsPanelTitle');
    const body = document.getElementById('newsPanelBody');

    title.textContent = `${prediction.name} News`;
    body.innerHTML = `
    <div class="news-loading">
      <div class="news-loading__spinner"></div>
      <p style="color:var(--text-muted);font-size:0.85rem;">Loading news...</p>
    </div>
  `;

    panel.style.display = 'flex';

    try {
        const news = await fetchCoinNews(prediction.coinId);

        if (!news || news.length === 0) {
            body.innerHTML = `
        <div class="news-empty">
          <p>No recent news found for ${sanitize(prediction.name)}.</p>
          <p style="margin-top:8px;">
            <a href="https://cryptopanic.com/news/${sanitize(prediction.symbol?.toLowerCase())}/" 
               target="_blank" rel="noopener noreferrer" 
               style="color:var(--accent-cyan);">
              Browse on CryptoPanic →
            </a>
          </p>
        </div>
      `;
            return;
        }

        body.innerHTML = news.map(item => {
            const sentimentClass = item.sentiment === 'positive' ? 'news-item__sentiment--positive' :
                item.sentiment === 'negative' ? 'news-item__sentiment--negative' :
                    'news-item__sentiment--neutral';

            const url = sanitizeUrl(item.url);

            return `
        <div class="news-item">
          <div class="news-item__source">
            <span class="news-item__source-name">${sanitize(item.source)}</span>
            <span class="news-item__time">${formatRelativeTime(item.publishedAt)}</span>
          </div>
          <div class="news-item__title">
            ${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${sanitize(item.title)}</a>` : sanitize(item.title)}
          </div>
          ${item.sentiment ? `<span class="news-item__sentiment ${sentimentClass}">${sanitize(item.sentiment)}</span>` : ''}
        </div>
      `;
        }).join('');

    } catch (err) {
        body.innerHTML = `
      <div class="news-empty">
        <p>Failed to load news: ${sanitize(err.message)}</p>
        <p style="margin-top:8px;">
          <a href="https://cryptopanic.com/news/${sanitize(prediction.symbol?.toLowerCase())}/" 
             target="_blank" rel="noopener noreferrer"
             style="color:var(--accent-cyan);">
            Browse on CryptoPanic →
          </a>
        </p>
      </div>
    `;
    }
}

/**
 * Close the news panel
 */
export function closeNewsPanel() {
    const panel = document.getElementById('newsPanel');
    panel.style.display = 'none';
}
