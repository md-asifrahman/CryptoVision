/**
 * CryptoVision — Main Application Entry Point
 * Orchestrates data fetching, prediction generation, UI rendering, and auto-refresh
 */

import './style.css';
import { fetchMarketData, fetchAllHistoricalPrices, COIN_IDS } from './api/coingecko.js';
import { generatePrediction } from './prediction/engine.js';
import { createCoinCard } from './components/coinCard.js';
import { renderCoinDetail } from './components/coinDetail.js';
import { openNewsPanel, closeNewsPanel } from './components/newsPanel.js';
import { getCached, setCached } from './utils/cache.js';

// === State ===
let predictions = [];
let refreshInterval = null;
let countdownInterval = null;
let nextRefreshTime = null;

const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_KEY_MARKET = 'market_data';
const CACHE_KEY_HISTORY = 'history_data';
const CACHE_KEY_PREDICTIONS = 'predictions';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

// === DOM References ===
const loadingScreen = document.getElementById('loadingScreen');
const mainContent = document.getElementById('mainContent');
const coinGrid = document.getElementById('coinGrid');
const errorBanner = document.getElementById('errorBanner');
const errorText = document.getElementById('errorText');
const retryBtn = document.getElementById('retryBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const newsPanelClose = document.getElementById('newsPanelClose');
const disclaimerClose = document.getElementById('disclaimerClose');
const lastUpdated = document.getElementById('lastUpdated');
const countdownText = document.getElementById('countdownText');
const marketMood = document.getElementById('marketMood');
const profitableCount = document.getElementById('profitableCount');
const neutralCount = document.getElementById('neutralCount');
const riskyCount = document.getElementById('riskyCount');

// === Init ===
async function init() {
  setupEventListeners();
  await loadData();
  startAutoRefresh();
}

// === Data Loading ===
async function loadData() {
  showLoading();
  hideError();

  try {
    // Try cache first
    const cachedPredictions = getCached(CACHE_KEY_PREDICTIONS);
    if (cachedPredictions && cachedPredictions.length > 0) {
      predictions = cachedPredictions;
      renderUI();
      // Still refresh in background
      refreshDataSilently();
      return;
    }

    // Fetch fresh data
    await fetchAndProcessData();
  } catch (err) {
    console.error('Failed to load data:', err);
    showError(`Failed to load market data: ${err.message}. Please try again.`);
  }
}

async function fetchAndProcessData() {
  // 1. Fetch market data
  let marketData = getCached(CACHE_KEY_MARKET);
  if (!marketData) {
    marketData = await fetchMarketData();
    setCached(CACHE_KEY_MARKET, marketData, CACHE_TTL);
  }

  // 2. Fetch historical prices
  let historicalPrices = getCached(CACHE_KEY_HISTORY);
  if (!historicalPrices) {
    historicalPrices = await fetchAllHistoricalPrices();
    setCached(CACHE_KEY_HISTORY, historicalPrices, CACHE_TTL);
  }

  // 3. Generate predictions
  predictions = marketData.map(coin => {
    const history = historicalPrices[coin.id] || [];
    return generatePrediction(history, coin);
  });

  // Sort: profitable first, then neutral, then risky
  const statusOrder = { profitable: 0, neutral: 1, risky: 2 };
  predictions.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  setCached(CACHE_KEY_PREDICTIONS, predictions, CACHE_TTL);
  renderUI();
}

async function refreshDataSilently() {
  try {
    const marketData = await fetchMarketData();
    setCached(CACHE_KEY_MARKET, marketData, CACHE_TTL);

    const historicalPrices = await fetchAllHistoricalPrices();
    setCached(CACHE_KEY_HISTORY, historicalPrices, CACHE_TTL);

    predictions = marketData.map(coin => {
      const history = historicalPrices[coin.id] || [];
      return generatePrediction(history, coin);
    });

    const statusOrder = { profitable: 0, neutral: 1, risky: 2 };
    predictions.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    setCached(CACHE_KEY_PREDICTIONS, predictions, CACHE_TTL);
    renderUI();
  } catch (err) {
    console.warn('Silent refresh failed:', err.message);
  }
}

// === Rendering ===
function renderUI() {
  hideLoading();
  mainContent.style.display = 'block';

  // Update market summary
  const profitable = predictions.filter(p => p.status === 'profitable').length;
  const neutral = predictions.filter(p => p.status === 'neutral').length;
  const risky = predictions.filter(p => p.status === 'risky').length;

  profitableCount.textContent = profitable;
  neutralCount.textContent = neutral;
  riskyCount.textContent = risky;

  if (profitable > risky) {
    marketMood.textContent = '🟢 Bullish';
    marketMood.style.color = 'var(--green)';
  } else if (risky > profitable) {
    marketMood.textContent = '🔴 Bearish';
    marketMood.style.color = 'var(--red)';
  } else {
    marketMood.textContent = '🟡 Mixed';
    marketMood.style.color = 'var(--yellow)';
  }

  // Update last updated
  lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;

  // Render coin cards
  coinGrid.innerHTML = '';
  predictions.forEach(prediction => {
    const card = createCoinCard(prediction, openDetail);
    coinGrid.appendChild(card);
  });
}

// === Detail Modal ===
function openDetail(prediction) {
  modalBody.innerHTML = '';
  const content = renderCoinDetail(prediction, (pred) => {
    openNewsPanel(pred);
  });
  modalBody.appendChild(content);
  modalOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.style.display = 'none';
  document.body.style.overflow = '';
}

// === Auto Refresh ===
function startAutoRefresh() {
  nextRefreshTime = Date.now() + REFRESH_INTERVAL_MS;

  // Countdown timer
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    const remaining = Math.max(0, nextRefreshTime - Date.now());
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    countdownText.textContent = `Refreshes in ${mins}:${secs.toString().padStart(2, '0')}`;
  }, 1000);

  // Actual refresh
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(async () => {
    nextRefreshTime = Date.now() + REFRESH_INTERVAL_MS;
    await refreshDataSilently();
  }, REFRESH_INTERVAL_MS);
}

// === UI Helpers ===
function showLoading() {
  loadingScreen.style.display = 'flex';
  loadingScreen.classList.remove('loading--hidden');
  mainContent.style.display = 'none';
}

function hideLoading() {
  loadingScreen.classList.add('loading--hidden');
  loadingScreen.style.display = 'none';
}

function showError(message) {
  hideLoading();
  errorText.textContent = message;
  errorBanner.style.display = 'flex';
}

function hideError() {
  errorBanner.style.display = 'none';
}

// === Event Listeners ===
function setupEventListeners() {
  // Modal close
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // News panel close
  newsPanelClose.addEventListener('click', closeNewsPanel);

  // Disclaimer close
  disclaimerClose.addEventListener('click', () => {
    document.getElementById('disclaimer').classList.add('disclaimer--hidden');
  });

  // Retry button
  retryBtn.addEventListener('click', async () => {
    hideError();
    await loadData();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const newsPanel = document.getElementById('newsPanel');
      if (newsPanel.style.display !== 'none') {
        closeNewsPanel();
      } else if (modalOverlay.style.display !== 'none') {
        closeModal();
      }
    }
  });
}

// === Start ===
init();
