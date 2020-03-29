'use strict';

const { ERROR_TOO_MANY_ERRORS } = require('yandex-speller');

/**
 * Get typos by code.
 *
 * @param {number} code
 * @param {Array} data
 * @returns {Array}
 */
function getTyposByCode(code, data) {
    return data.filter(el => el.code === code);
}

/**
 * Has many errors.
 *
 * @param {Array} data
 * @returns {boolean}
 */
function hasManyErrors(data) {
    return data.some(el => el.code === ERROR_TOO_MANY_ERRORS);
}

module.exports = {
    getTyposByCode,
    hasManyErrors,
};
