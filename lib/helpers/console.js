
const chalk = require('chalk');

const { jsonStringify } = require('./string');
const { isDebugMode } = require('./debug');

function consoleLog(data) {
    console.log(data);
}

function consoleInfo(data) {
    console.info(chalk.cyan(data));
}

function consoleWarn(data) {
    console.warn(chalk.yellow(data));
}

function consoleError(data) {
    console.error(chalk.red(data));
}

function consoleOk(data) {
    console.log(chalk.green(data));
}

/**
 * Print debug info.
 *
 * @param {string|Object} text
 */
function consoleDebug(text) {
    if (isDebugMode()) {
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
    consoleError,
    consoleDebug,
    consoleInfo,
    consoleLog,
    consoleOk,
    consoleWarn,
};
