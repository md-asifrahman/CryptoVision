/**
 * Cache utility using localStorage with TTL
 */

const CACHE_PREFIX = 'cv_';

/**
 * Get cached data
 * @param {string} key
 * @returns {any|null}
 */
export function getCached(key) {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;

        const { data, expiry } = JSON.parse(raw);
        if (Date.now() > expiry) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

/**
 * Set cached data with TTL
 * @param {string} key
 * @param {any} data
 * @param {number} ttlMs - Time to live in milliseconds
 */
export function setCached(key, data, ttlMs = 30 * 60 * 1000) {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
            data,
            expiry: Date.now() + ttlMs,
        }));
    } catch (e) {
        console.warn('Cache write failed:', e.message);
    }
}

/**
 * Clear all cached data
 */
export function clearCache() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
}
