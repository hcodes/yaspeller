'use strict';

const { consoleError } = require('./console');

/**
 * Has ignored text?
 *
 * @param {string} text
 * @returns {boolean}
 */
function hasIgnoredText(text) {
    return text.search(/yaspeller\s+ignore/) !== -1;
}

/**
 * Ignore lines.
 *
 * @param {string} text
 * @returns {text}
 */
function ignoreLines(text) {
    return text
        .replace(/^.*?\/\/\s*yaspeller\s+ignore\s*$/mg, '')
        .replace(/^.*?<!--\s*yaspeller\s+ignore\s*-->.*?$/mg, '')
        .replace(/^.*?\/\*\s*yaspeller\s+ignore\s*\*\/.*?$/mg, '');
}

/**
 * Ignore blocks.
 *
 * @param {string} text
 * @returns {text}
 */
function ignoreBlocks(text) {
    return text
        .replace(/\/\*\s*yaspeller\s+ignore:start\s*\*\/[^]*?\/\*\s*yaspeller\s+ignore:end\s*\*\//g, '')
        .replace(/<!--\s*yaspeller\s+ignore:start\s*-->[^]*?<!--\s*yaspeller\s+ignore:end\s*-->/g, '')
        .replace(/\/\/\s*yaspeller\s+ignore:start[^]*?\/\/\s*yaspeller\s+ignore:end.*?(\r?\n|$)/g, '');
}

/**
 * Ignore HTML comments.
 *
 * @param {string} text
 * @returns {text}
 */
function ignoreComments(text) {
    const comments = [
        ['<!--', '-->'],
        ['<!ENTITY', '>'],
        ['<!DOCTYPE', '>'],
        ['<\\?xml', '\\?>'],
        ['<!\\[CDATA\\[', '\\]\\]>']
    ];

    for (const tag of comments) {
        text = text.replace(
            new RegExp(tag[0] + '[^]*?' + tag[1], 'gi'),
            ' '
        );
    }

    return text;
}

/**
 * Ignore tags.
 *
 * @param {string} text
 * @param {Array} tags
 * @returns {text}
 */
function ignoreTags(text, tags) {
    for (const name of tags) {
        const openingTags = '<' + name + '(\\s[^>]*?)?>';
        const closingTags = '</' + name + '>';

        text = text.replace(
            new RegExp(openingTags + '[^]*?' + closingTags, 'gi'),
            ' … ' // For repeated words. Example: the `code` the.
        );
    }

    return text;
}

/**
 * Prepares regular expressions to remove text.
 *
 * @param {Array|undefined} data
 *
 * @returns {Array}
 */
function prepareRegExpToIgnoreText(data) {
    const result = [];

    if (typeof data === 'string') {
        data = [data];
    }

    Array.isArray(data) && data.forEach(re => {
        try {
            if (typeof re === 'string') {
                result.push(new RegExp(re, 'g'));
            }

            if (Array.isArray(re)) {
                result.push(new RegExp(re[0], typeof re[1] === 'undefined' ? 'g' : re[1]));
            }
        } catch (e) {
            consoleError(`Error in RegExp "${re}": ${e}`);
        }
    });

    return result;
}

module.exports = {
    hasIgnoredText,
    ignoreBlocks,
    ignoreComments,
    ignoreLines,
    ignoreTags,
    prepareRegExpToIgnoreText,
};
