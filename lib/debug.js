'use strict';

var chalk = require('chalk'),
    _ = require('lodash'),
    isDebug = false;

module.exports = {
    /**
     * Set debug mode.
     *
     * @param {boolean} val
     */
    setDebug: function(val) {
        isDebug = val;
    },
    /**
     * Print debug info.
     *
     * @param {string|Object} text
     */
    print: function(text) {
        if(isDebug) {
            if(typeof text === 'object') {
                console.log(chalk.cyan('[DEBUG]'));
                _.forOwn(text, function(value, key) {
                    console.log(chalk.cyan('    ' + key + ': ') + value);
                });
            } else {
                console.log(chalk.cyan('[DEBUG]') + ' ' + text);
            }
        }
    }
};
