/**
 * Technical Analysis Engine
 * Computes RSI, SMA, EMA, MACD, and Bollinger Bands from price data
 */

/**
 * Simple Moving Average
 * @param {number[]} prices - Array of prices
 * @param {number} period - Number of periods
 * @returns {number} SMA value
 */
export function calcSMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const slice = prices.slice(-period);
    return slice.reduce((sum, p) => sum + p, 0) / period;
}

/**
 * Exponential Moving Average
 * @param {number[]} prices
 * @param {number} period
 * @returns {number} Latest EMA value
 */
export function calcEMA(prices, period) {
    if (prices.length < period) return calcSMA(prices, prices.length);
    const k = 2 / (period + 1);
    let ema = calcSMA(prices.slice(0, period), period);
    for (let i = period; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
}

/**
 * Relative Strength Index (14-period)
 * @param {number[]} prices
 * @param {number} period
 * @returns {number} RSI value 0-100
 */
export function calcRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50; // neutral fallback

    let gains = 0;
    let losses = 0;

    // First average gain/loss
    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Smooth subsequent values
    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) {
            avgGain = (avgGain * (period - 1) + change) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
        }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

/**
 * MACD (12, 26, 9)
 * @param {number[]} prices
 * @returns {{ macd: number, signal: number, histogram: number }}
 */
export function calcMACD(prices) {
    const ema12 = calcEMA(prices, 12);
    const ema26 = calcEMA(prices, 26);
    const macdLine = ema12 - ema26;

    // For signal line, we need MACD history
    const macdHistory = [];
    for (let i = 26; i <= prices.length; i++) {
        const e12 = calcEMA(prices.slice(0, i), 12);
        const e26 = calcEMA(prices.slice(0, i), 26);
        macdHistory.push(e12 - e26);
    }

    const signal = macdHistory.length >= 9 ? calcEMA(macdHistory, 9) : macdLine;
    const histogram = macdLine - signal;

    return { macd: macdLine, signal, histogram };
}

/**
 * Bollinger Bands (20-period, 2 standard deviations)
 * @param {number[]} prices
 * @param {number} period
 * @param {number} stdDev
 * @returns {{ upper: number, middle: number, lower: number, bandwidth: number }}
 */
export function calcBollingerBands(prices, period = 20, stdDev = 2) {
    const middle = calcSMA(prices, period);
    const slice = prices.slice(-period);

    const variance = slice.reduce((sum, p) => sum + Math.pow(p - middle, 2), 0) / period;
    const sd = Math.sqrt(variance);

    return {
        upper: middle + stdDev * sd,
        middle,
        lower: middle - stdDev * sd,
        bandwidth: (stdDev * sd * 2) / middle * 100,
    };
}

/**
 * Calculate support and resistance levels from price data
 * @param {number[]} prices
 * @returns {{ support: number, resistance: number }}
 */
export function calcSupportResistance(prices) {
    if (prices.length < 5) {
        const current = prices[prices.length - 1] || 0;
        return { support: current * 0.95, resistance: current * 1.05 };
    }

    const recentPrices = prices.slice(-14);
    const low = Math.min(...recentPrices);
    const high = Math.max(...recentPrices);
    const current = recentPrices[recentPrices.length - 1];

    // Support: weighted average of recent lows and Fibonacci retracement
    const range = high - low;
    const fib382 = high - range * 0.382;
    const fib618 = high - range * 0.618;

    const support = current > fib382 ? fib382 : fib618;
    const resistance = current < fib382 ? fib382 : high + range * 0.236;

    return { support, resistance };
}

/**
 * Run all technical analysis on a price series
 * @param {number[]} prices - Historical daily prices (30 days)
 * @returns {Object} All indicator values
 */
export function analyzeAll(prices) {
    if (!prices || prices.length < 5) {
        return {
            rsi: 50,
            sma20: 0,
            sma50: 0,
            ema12: 0,
            ema26: 0,
            macd: { macd: 0, signal: 0, histogram: 0 },
            bollingerBands: { upper: 0, middle: 0, lower: 0, bandwidth: 0 },
            supportResistance: { support: 0, resistance: 0 },
            currentPrice: 0,
            valid: false,
        };
    }

    return {
        rsi: calcRSI(prices),
        sma20: calcSMA(prices, 20),
        sma50: calcSMA(prices, Math.min(50, prices.length)),
        ema12: calcEMA(prices, 12),
        ema26: calcEMA(prices, 26),
        macd: calcMACD(prices),
        bollingerBands: calcBollingerBands(prices),
        supportResistance: calcSupportResistance(prices),
        currentPrice: prices[prices.length - 1],
        valid: true,
    };
}
