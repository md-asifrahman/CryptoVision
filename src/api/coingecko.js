/**
 * CoinGecko API Service
 * Free tier — no API key required, ~30 calls/min
 */

const BASE_URL = 'https://api.coingecko.com/api/v3';

// CoinGecko IDs for our tracked coins
export const COIN_IDS = {
  BTC: 'bitcoin',
  XLM: 'stellar',
  XTZ: 'tezos',
  NEAR: 'near',
  AVAX: 'avalanche-2',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  LINK: 'chainlink',
  DOT: 'polkadot',
  ETC: 'ethereum-classic',
};

const ALL_IDS = Object.values(COIN_IDS).join(',');

/**
 * Fetch current market data for all tracked coins
 * Returns array of coin market data objects
 */
export async function fetchMarketData() {
  const url = `${BASE_URL}/coins/markets?vs_currency=usd&ids=${ALL_IDS}&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h,24h,7d`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`CoinGecko API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data;
}

/**
 * Fetch 30-day historical price data for technical analysis
 * Includes retry with exponential backoff for 429 rate limit errors
 * @param {string} coinId - CoinGecko coin ID
 * @param {number} retries - Number of retry attempts remaining
 * @returns {Promise<number[]>} Array of daily closing prices
 */
export async function fetchHistoricalPrices(coinId, retries = 3) {
  const url = `${BASE_URL}/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=30&interval=daily`;

  const res = await fetch(url);

  if (res.status === 429 && retries > 0) {
    // Rate limited — wait and retry with exponential backoff
    const waitTime = (4 - retries) * 5000; // 5s, 10s, 15s
    console.warn(`Rate limited for ${coinId}, retrying in ${waitTime / 1000}s...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return fetchHistoricalPrices(coinId, retries - 1);
  }

  if (!res.ok) {
    throw new Error(`CoinGecko history API error: ${res.status}`);
  }

  const data = await res.json();
  // data.prices is [[timestamp, price], ...]
  return data.prices.map(p => p[1]);
}

/**
 * Fetch all historical prices sequentially with delay to respect rate limits
 * CoinGecko free tier allows ~10-30 calls per minute
 * @returns {Promise<Object>} Map of coinId -> price array
 */
export async function fetchAllHistoricalPrices() {
  const entries = Object.entries(COIN_IDS);
  const result = {};

  // Fetch one at a time with 4s delay to respect rate limits
  for (let i = 0; i < entries.length; i++) {
    const [symbol, id] = entries[i];
    try {
      const prices = await fetchHistoricalPrices(id);
      result[id] = prices;
    } catch (err) {
      console.warn(`Failed to fetch history for ${symbol}:`, err.message);
      result[id] = [];
    }

    // Delay between requests (except after the last one)
    if (i < entries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 4000));
    }
  }

  return result;
}
