'use strict';

module.exports = {
    /**
     * Is HTML?
     *
     * @param {string} text
     * @returns {boolean}
     */
    isHTML(text) {
        return text.search(/<[a-z!]/i) !== -1;
    },
    /**
     * Is Markdown?
     *
     * @param {string} text
     * @returns {boolean}
     */
    isMarkdown(text) {
        return [
            /^===/m,
            /^\s{0,5}```/m,
            /-- ?:?\|/,
            /\)\[(https?|mailto):/
        ].some(el => text.search(el) !== -1);
    },
    /**
     * Get format.
     *
     * @param {string} text
     * @param {Object} settings
     * @returns {string}
     */
    getFormat(text, settings) {
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

            if (this.isMarkdown(text)) {
                return 'markdown';
            } else if (this.isHTML(text)) {
                return 'html';
            }
        }

        return 'plain';
    },
    /**
     * Get API format.
     *
     * @param {string} format
     * @returns {string}
     */
    getApiFormat(format) {
        return format === 'html' || format === 'markdown' ? 'html' : 'plain';
    }
};
