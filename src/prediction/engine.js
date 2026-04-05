/**
 * Prediction Engine
 * Combines technical indicators into actionable trading signals
 */

import { analyzeAll } from '../analysis/technical.js';

/**
 * Generate a full prediction for a coin
 * @param {number[]} historicalPrices - 30-day price array
 * @param {Object} marketData - CoinGecko market data object
 * @returns {Object} Complete prediction with status, entry/exit points, confidence
 */
export function generatePrediction(historicalPrices, marketData) {
    const ta = analyzeAll(historicalPrices);
    const currentPrice = marketData.current_price;

    if (!ta.valid || !currentPrice) {
        return createEmptyPrediction(marketData);
    }

    // === Compute composite score from indicators ===
    const signals = [];

    // RSI Signal
    if (ta.rsi < 30) signals.push({ name: 'RSI', value: 1, weight: 2 });       // Oversold → buy
    else if (ta.rsi < 40) signals.push({ name: 'RSI', value: 0.5, weight: 2 });
    else if (ta.rsi > 70) signals.push({ name: 'RSI', value: -1, weight: 2 });  // Overbought → sell
    else if (ta.rsi > 60) signals.push({ name: 'RSI', value: -0.5, weight: 2 });
    else signals.push({ name: 'RSI', value: 0, weight: 2 });

    // SMA Crossover Signal
    if (ta.sma20 > ta.sma50) signals.push({ name: 'SMA Cross', value: 0.8, weight: 1.5 });
    else signals.push({ name: 'SMA Cross', value: -0.8, weight: 1.5 });

    // EMA Trend Signal
    if (ta.ema12 > ta.ema26) signals.push({ name: 'EMA Trend', value: 0.7, weight: 1.5 });
    else signals.push({ name: 'EMA Trend', value: -0.7, weight: 1.5 });

    // MACD Signal
    if (ta.macd.histogram > 0) {
        signals.push({ name: 'MACD', value: Math.min(ta.macd.histogram / Math.abs(ta.macd.signal || 1), 1), weight: 2 });
    } else {
        signals.push({ name: 'MACD', value: Math.max(ta.macd.histogram / Math.abs(ta.macd.signal || 1), -1), weight: 2 });
    }

    // Bollinger Band Position
    const bbPosition = (currentPrice - ta.bollingerBands.lower) / (ta.bollingerBands.upper - ta.bollingerBands.lower || 1);
    if (bbPosition < 0.2) signals.push({ name: 'Bollinger', value: 1, weight: 1.5 });
    else if (bbPosition > 0.8) signals.push({ name: 'Bollinger', value: -1, weight: 1.5 });
    else signals.push({ name: 'Bollinger', value: 0.5 - bbPosition, weight: 1.5 });

    // 24h momentum
    const change24h = marketData.price_change_percentage_24h || 0;
    if (change24h > 5) signals.push({ name: 'Momentum 24h', value: -0.3, weight: 1 }); // Hot → possible pullback
    else if (change24h > 2) signals.push({ name: 'Momentum 24h', value: 0.3, weight: 1 });
    else if (change24h < -5) signals.push({ name: 'Momentum 24h', value: 0.5, weight: 1 }); // Dip → possible bounce
    else if (change24h < -2) signals.push({ name: 'Momentum 24h', value: 0.2, weight: 1 });
    else signals.push({ name: 'Momentum 24h', value: 0, weight: 1 });

    // === Calculate composite score ===
    const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
    const weightedSum = signals.reduce((sum, s) => sum + s.value * s.weight, 0);
    const compositeScore = weightedSum / totalWeight; // Range: -1 to 1

    // === Determine status ===
    let status, statusLabel;
    if (compositeScore > 0.25) {
        status = 'profitable';
        statusLabel = 'Profitable';
    } else if (compositeScore < -0.25) {
        status = 'risky';
        statusLabel = 'Risky';
    } else {
        status = 'neutral';
        statusLabel = 'Neutral';
    }

    // === Calculate entry/exit points ===
    const { support, resistance } = ta.supportResistance;
    const bb = ta.bollingerBands;

    // Long trade (buy low, sell high)
    const longEntry = Math.min(support, bb.lower) * 1.005; // Slightly above support
    const longTarget = Math.max(resistance, bb.upper) * 0.995;
    const longStopLoss = longEntry * 0.97; // 3% below entry

    // Short trade (sell high, buy low)
    const shortEntry = Math.max(resistance, bb.upper) * 0.995;
    const shortTarget = Math.min(support, bb.lower) * 1.005;
    const shortStopLoss = shortEntry * 1.03; // 3% above entry

    // === Confidence ===
    const absScore = Math.abs(compositeScore);
    let confidence, confidenceLabel;
    if (absScore > 0.5) {
        confidence = 'high';
        confidenceLabel = 'High';
    } else if (absScore > 0.2) {
        confidence = 'medium';
        confidenceLabel = 'Medium';
    } else {
        confidence = 'low';
        confidenceLabel = 'Low';
    }

    return {
        coinId: marketData.id,
        symbol: marketData.symbol?.toUpperCase(),
        name: marketData.name,
        image: marketData.image,
        currentPrice,
        status,
        statusLabel,
        compositeScore,
        confidence,
        confidenceLabel,

        // Market data
        high24h: marketData.high_24h,
        low24h: marketData.low_24h,
        change24h: marketData.price_change_percentage_24h,
        change7d: marketData.price_change_percentage_7d_in_currency,
        volume: marketData.total_volume,
        marketCap: marketData.market_cap,
        ath: marketData.ath,
        athChangePercent: marketData.ath_change_percentage,
        sparkline: marketData.sparkline_in_7d?.price || [],

        // Trading signals
        longTrade: {
            entry: longEntry,
            target: longTarget,
            stopLoss: longStopLoss,
            potentialGain: ((longTarget - longEntry) / longEntry * 100),
            potentialLoss: ((longEntry - longStopLoss) / longEntry * 100),
        },
        shortTrade: {
            entry: shortEntry,
            target: shortTarget,
            stopLoss: shortStopLoss,
            potentialGain: ((shortEntry - shortTarget) / shortEntry * 100),
            potentialLoss: ((shortStopLoss - shortEntry) / shortEntry * 100),
        },

        // Indicators
        indicators: {
            rsi: { value: ta.rsi, signal: ta.rsi < 30 ? 'buy' : ta.rsi > 70 ? 'sell' : 'neutral' },
            sma: { sma20: ta.sma20, sma50: ta.sma50, signal: ta.sma20 > ta.sma50 ? 'buy' : 'sell' },
            ema: { ema12: ta.ema12, ema26: ta.ema26, signal: ta.ema12 > ta.ema26 ? 'buy' : 'sell' },
            macd: { ...ta.macd, signal: ta.macd.histogram > 0 ? 'buy' : 'sell' },
            bollingerBands: { ...ta.bollingerBands, signal: bbPosition < 0.3 ? 'buy' : bbPosition > 0.7 ? 'sell' : 'neutral' },
        },

        signals,
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Create an empty prediction for coins with insufficient data
 */
function createEmptyPrediction(marketData) {
    return {
        coinId: marketData.id,
        symbol: marketData.symbol?.toUpperCase(),
        name: marketData.name,
        image: marketData.image,
        currentPrice: marketData.current_price || 0,
        status: 'neutral',
        statusLabel: 'Neutral',
        compositeScore: 0,
        confidence: 'low',
        confidenceLabel: 'Low (Insufficient Data)',

        high24h: marketData.high_24h,
        low24h: marketData.low_24h,
        change24h: marketData.price_change_percentage_24h,
        change7d: marketData.price_change_percentage_7d_in_currency,
        volume: marketData.total_volume,
        marketCap: marketData.market_cap,
        ath: marketData.ath,
        athChangePercent: marketData.ath_change_percentage,
        sparkline: marketData.sparkline_in_7d?.price || [],

        longTrade: { entry: 0, target: 0, stopLoss: 0, potentialGain: 0, potentialLoss: 0 },
        shortTrade: { entry: 0, target: 0, stopLoss: 0, potentialGain: 0, potentialLoss: 0 },
        indicators: {},
        signals: [],
        lastUpdated: new Date().toISOString(),
    };
}
