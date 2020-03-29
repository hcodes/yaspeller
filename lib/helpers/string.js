'use strict';

/**
 * Is HTML?
 *
 * @param {string} text
 * @returns {boolean}
 */
function isHTML(text) {
    return text.search(/<[a-z!]/i) !== -1;
}

/**
 * Is Markdown?
 *
 * @param {string} text
 * @returns {boolean}
 */
function isMarkdown(text) {
    return [
        /^===/m,
        /^\s{0,5}```/m,
        /-- ?:?\|/,
        /\)\[(https?|mailto):/
    ].some(el => text.search(el) !== -1);
}

/**
 * Split string by separator with trim.
 *
 * @param {string} value
 * @param {string} separator
 * 
 * @returns {String[]}
 */
function splitTrim(value, separator) {
    return value.split(separator).map(el => el.trim());
}

/**
 * Split string by comma with trim.
 *
 * @param {string} value
 * 
 * @returns {String[]}
 */
function splitByCommas(value) {
    return splitTrim(value, ',');
}

/**
 * Converts string to kebab case.
 *
 * @param {string} text
 * @returns {string}
 */
function kebabCase(text) {
    return text.replace(/[A-Z]/g, $ => '-' + $.toLowerCase());
}

/**
 * Has english and russian letters?
 *
 * @param {string} text
 * @returns {boolean}
 */
function hasEngRusLetters(text) {
    return text.search(/[a-z]/i) > -1 && text.search(/[а-яё]/i) > -1;
}

/**
 * Replace Russian letters with asterisk.
 *
 * @param {string} word
 * @returns {string}
 */
function replaceRusLettersWithAsterisk(word) {
    return word.replace(/[а-яё]/gi, '*');
}

/**
 * Replace Latin letters with asterisk.
 *
 * @param {string} word
 * @returns {string}
 */
function replaceEngLettersWithAsterisk(word) {
    return word.replace(/[a-z]/gi, '*');
}

/**
 * JSON stringify.
 * 
 * @param {any} data
 * @returns {string}
 */
function jsonStringify(data) {
    return JSON.stringify(data, null, 2);
}
/**
 * Strip HTML tags.
 * 
 * @param {string} html 
 * 
 * @returns {string}
 */
function stripTags(html) {
    return html.replace(/<\/?[a-z][^>]*>/gi, ' ');
}

module.exports = {
    hasEngRusLetters,
    isHTML,
    isMarkdown,
    kebabCase,
    jsonStringify,
    replaceRusLettersWithAsterisk,
    replaceEngLettersWithAsterisk,
    splitByCommas,
    splitTrim,
    stripTags,
};
