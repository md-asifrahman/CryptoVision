/**
 * Security utilities — input sanitization and XSS prevention
 */

/**
 * Sanitize a string for safe DOM insertion
 * Removes HTML tags and encodes special chars
 * @param {string} str
 * @returns {string}
 */
export function sanitize(str) {
    if (typeof str !== 'string') return String(str ?? '');
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Sanitize a URL — only allow http/https protocols
 * @param {string} url
 * @returns {string} Sanitized URL or empty string
 */
export function sanitizeUrl(url) {
    if (typeof url !== 'string') return '';
    try {
        const parsed = new URL(url);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch {
        // Invalid URL
    }
    return '';
}

/**
 * Format a number safely
 * @param {number} num
 * @param {Object} options
 * @returns {string}
 */
export function formatNumber(num, { decimals = 2, style = 'decimal', currency = 'USD' } = {}) {
    if (typeof num !== 'number' || isNaN(num)) return '--';

    if (style === 'currency') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(num);
    }

    if (style === 'compact') {
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(num);
    }

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
}

/**
 * Format a price with appropriate decimal places
 * @param {number} price
 * @returns {string}
 */
export function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) return '$--';
    if (price >= 1000) return formatNumber(price, { decimals: 2, style: 'currency' });
    if (price >= 1) return formatNumber(price, { decimals: 4, style: 'currency' });
    if (price >= 0.01) return formatNumber(price, { decimals: 5, style: 'currency' });
    return formatNumber(price, { decimals: 8, style: 'currency' });
}

/**
 * Format percentage
 * @param {number} pct
 * @returns {string}
 */
export function formatPercent(pct) {
    if (typeof pct !== 'number' || isNaN(pct)) return '--';
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
}

/**
 * Format a date relative to now
 * @param {string} dateStr
 * @returns {string}
 */
export function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        const diff = Date.now() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    } catch {
        return '';
    }
}
