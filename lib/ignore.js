'use strict';

const chalk = require('chalk');

module.exports = {
    /**
     * Has ignored text?
     *
     * @param {string} text
     * @returns {boolean}
     */
    hasIgnoredText(text) {
        return text.search(/yaspeller\s+ignore/) !== -1;
    },
    /**
     * Ignore lines.
     *
     * @param {string} text
     * @returns {text}
     */
    lines(text) {
        return text
            .replace(/^.*?\/\/\s*yaspeller\s+ignore\s*$/mg, '')
            .replace(/^.*?<!--\s*yaspeller\s+ignore\s*-->.*?$/mg, '')
            .replace(/^.*?\/\*\s*yaspeller\s+ignore\s*\*\/.*?$/mg, '');
    },
    /**
     * Ignore blocks.
     *
     * @param {string} text
     * @returns {text}
     */
    blocks(text) {
        return text
            .replace(/\/\*\s*yaspeller\s+ignore:start\s*\*\/[^]*?\/\*\s*yaspeller\s+ignore:end\s*\*\//g, '')
            .replace(/<!--\s*yaspeller\s+ignore:start\s*-->[^]*?<!--\s*yaspeller\s+ignore:end\s*-->/g, '')
            .replace(/\/\/\s*yaspeller\s+ignore:start[^]*?\/\/\s*yaspeller\s+ignore:end.*?(\r?\n|$)/g, '');
    },
    /**
     * Ignore HTML comments.
     *
     * @param {string} text
     * @returns {text}
     */
    comments(text) {
        const comments = [
            ['<!--', '-->'],
            ['<!ENTITY', '>'],
            ['<!DOCTYPE', '>'],
            ['<\\?xml', '\\?>'],
            ['<!\\[CDATA\\[', '\\]\\]>']
        ];

        comments.forEach(function(tag) {
            const re = new RegExp(tag[0] + '[^]*?' + tag[1], 'gi');
            text = text.replace(re, ' ');
        });

        return text;
    },
    /**
     * Ignore tags.
     *
     * @param {string} text
     * @param {Array} tags
     * @returns {text}
     */
    tags(text, tags) {
        const bufTags = [];
        tags.forEach(function(tag) {
            bufTags.push(['<' + tag + '(\\s[^>]*?)?>', '</' + tag + '>']);
        }, this);

        bufTags.forEach(function(tag) {
            const re = new RegExp(tag[0] + '[^]*?' + tag[1], 'gi');
            text = text.replace(re, ' ');
        });

        return text;
    },
    /**
     * Prepares regular expressions to remove text.
     *
     * @param {Array|undefined} data
     *
     * @returns {Array}
     */
    prepareRegExpToIgnoreText(data) {
        const result = [];

        if (typeof data === 'string') {
            data = [data];
        }

        Array.isArray(data) && data.forEach(function(re) {
            try {
                if (typeof re === 'string') {
                    result.push(new RegExp(re, 'g'));
                }

                if (Array.isArray(re)) {
                    result.push(new RegExp(re[0], typeof re[1] === 'undefined' ? 'g' : re[1]));
                }
            } catch (e) {
                console.error(chalk.red('Error in RegExp "' + re.toString() + '": ' + e));
            }
        });

        return result;
    }
};
