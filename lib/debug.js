'use strict';

const chalk = require('chalk');

let isDebug = false;

module.exports = {
    /**
     * Set debug mode.
     *
     * @param {boolean} val
     */
    setDebug(val) {
        isDebug = val;
    },
    /**
     * Print debug info.
     *
     * @param {string|Object} text
     */
    print(text) {
        if (isDebug) {
            if (typeof text === 'object') {
                console.log(chalk.cyan('[DEBUG]'));
                Object.keys(text).forEach(function(key) {
                    console.log(chalk.cyan('    ' + key + ': ') + text[key]);
                });
            } else {
                console.log(chalk.cyan('[DEBUG]') + ' ' + text);
            }
        }
    }
};
