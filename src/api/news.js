/**
 * Crypto News Service
 * Uses CryptoPanic public RSS proxy or direct search fallback
 */

const CRYPTOPANIC_BASE = 'https://cryptopanic.com/api/free/v1/posts/';

// Map of coin symbols → search terms for news
const NEWS_SEARCH_TERMS = {
    bitcoin: 'BTC,Bitcoin',
    stellar: 'XLM,Stellar',
    tezos: 'XTZ,Tezos',
    near: 'NEAR',
    'avalanche-2': 'AVAX,Avalanche',
    ripple: 'XRP,Ripple',
    cardano: 'ADA,Cardano',
    dogecoin: 'DOGE,Dogecoin',
    chainlink: 'LINK,Chainlink',
    polkadot: 'DOT,Polkadot',
    'ethereum-classic': 'ETC,Ethereum Classic',
};

// Symbol mapping for CryptoPanic currency filter
const COIN_SYMBOLS = {
    bitcoin: 'BTC',
    stellar: 'XLM',
    tezos: 'XTZ',
    near: 'NEAR',
    'avalanche-2': 'AVAX',
    ripple: 'XRP',
    cardano: 'ADA',
    dogecoin: 'DOGE',
    chainlink: 'LINK',
    polkadot: 'DOT',
    'ethereum-classic': 'ETC',
};

/**
 * Fetch news for a specific coin
 * Uses CryptoPanic free API (no auth required for public posts)
 * Falls back to a curated news search approach if API unavailable
 * @param {string} coinId - CoinGecko coin ID
 * @returns {Promise<Array>} Array of news items
 */
export async function fetchCoinNews(coinId) {
    const symbol = COIN_SYMBOLS[coinId] || coinId.toUpperCase();

    try {
        // Try CryptoPanic free public endpoint
        const url = `${CRYPTOPANIC_BASE}?auth_token=free&currencies=${symbol}&kind=news&public=true`;
        const res = await fetch(url);

        if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                return data.results.slice(0, 15).map(item => ({
                    title: item.title,
                    url: item.url,
                    source: item.source?.title || 'Unknown',
                    publishedAt: item.published_at,
                    sentiment: mapVotes(item.votes),
                }));
            }
        }
    } catch (e) {
        console.warn('CryptoPanic API unavailable, using fallback:', e.message);
    }

    // Fallback: generate curated news links
    return generateFallbackNews(coinId, symbol);
}

/**
 * Map CryptoPanic votes to sentiment
 */
function mapVotes(votes) {
    if (!votes) return 'neutral';
    const positive = (votes.positive || 0) + (votes.liked || 0);
    const negative = (votes.negative || 0) + (votes.disliked || 0);
    if (positive > negative + 2) return 'positive';
    if (negative > positive + 2) return 'negative';
    return 'neutral';
}

/**
 * Generate fallback news with real links to news sources
 */
function generateFallbackNews(coinId, symbol) {
    const searchTerms = NEWS_SEARCH_TERMS[coinId] || symbol;
    const primaryTerm = searchTerms.split(',')[0];

    return [
        {
            title: `Latest ${primaryTerm} News & Analysis`,
            url: `https://www.coindesk.com/tag/${coinId === 'avalanche-2' ? 'avalanche' : coinId}/`,
            source: 'CoinDesk',
            publishedAt: new Date().toISOString(),
            sentiment: 'neutral',
        },
        {
            title: `${primaryTerm} Price Analysis & Market Updates`,
            url: `https://cointelegraph.com/tags/${coinId === 'avalanche-2' ? 'avalanche' : coinId}`,
            source: 'CoinTelegraph',
            publishedAt: new Date().toISOString(),
            sentiment: 'neutral',
        },
        {
            title: `${symbol} Market Overview & Trading Volume`,
            url: `https://www.coingecko.com/en/coins/${coinId}`,
            source: 'CoinGecko',
            publishedAt: new Date().toISOString(),
            sentiment: 'neutral',
        },
        {
            title: `${primaryTerm} Community Discussion & Insights`,
            url: `https://www.reddit.com/r/CryptoCurrency/search/?q=${encodeURIComponent(primaryTerm)}`,
            source: 'Reddit',
            publishedAt: new Date().toISOString(),
            sentiment: 'neutral',
        },
        {
            title: `${symbol} Real-Time News Feed`,
            url: `https://cryptopanic.com/news/${symbol.toLowerCase()}/`,
            source: 'CryptoPanic',
            publishedAt: new Date().toISOString(),
            sentiment: 'neutral',
        },
    ];
}
