'use strict';

const { isHTML, isMarkdown } = require('./string');

/**
 * Get format.
 *
 * @param {string} text
 * @param {Object} settings
 * @returns {string}
 */
function getFormat(text, settings) {
    const format = settings.format;
    const extname = (settings.extname || '').toLowerCase();
    const extnames = {
        '.htm': 'html',
        '.html': 'html',
        '.xhtml': 'html',
        '.xml': 'html',
        '.svg': 'html',
        '.markdown': 'markdown',
        '.md': 'markdown'
    };

    if (['html', 'markdown', 'plain'].indexOf(format) !== -1) {
        return format;
    }

    if (format === 'auto' || !format) {
        if (extnames[extname]) {
            return extnames[extname];
        }

        if (isMarkdown(text)) {
            return 'markdown';
        } else if (isHTML(text)) {
            return 'html';
        }
    }

    return 'plain';
}

/**
 * Get API format.
 *
 * @param {string} format
 * @returns {string}
 */
function getApiFormat(format) {
    return format === 'html' || format === 'markdown' ? 'html' : 'plain';
}

module.exports = {
    getFormat,
    getApiFormat,
};
