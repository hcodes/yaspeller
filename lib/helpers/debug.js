'use strict';

const chalk = require('chalk');

const { jsonStringify } = require('./string');

let isDebugMode = false;

/**
 * Set debug mode.
 *
 * @param {boolean} val
 */
function setDebugMode(val) {
    isDebugMode = val;
}

/**
 * Print debug info.
 *
 * @param {string|Object} text
 */
function printDebugInfo(text) {
    if (isDebugMode) {
        const prefix = chalk.cyan('[DEBUG]');
        if (typeof text === 'object' && text) {
            console.log(prefix);

            Object.keys(text).forEach(key => {
                console.log(chalk.cyan('    ' + key + ': ') + jsonStringify(text[key]));
            });
        } else {
            console.log(prefix + ' ' + text);
        }
    }
}

module.exports = {
    printDebugInfo,
    setDebugMode,
};
