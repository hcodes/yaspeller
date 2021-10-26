
const pico = require('picocolors');

const { jsonStringify } = require('./string');
const { isDebugMode } = require('./debug');

function consoleLog(data) {
    console.log(data);
}

function consoleInfo(data) {
    console.info(pico.cyan(data));
}

function consoleWarn(data) {
    console.warn(pico.yellow(data));
}

function consoleError(data) {
    console.error(pico.red(data));
}

function consoleOk(data) {
    console.log(pico.green(data));
}

/**
 * Print debug info.
 *
 * @param {string|Object} text
 */
function consoleDebug(text) {
    if (isDebugMode()) {
        const prefix = pico.cyan('[DEBUG]');
        if (typeof text === 'object' && text) {
            console.log(prefix);

            Object.keys(text).forEach(key => {
                console.log(pico.cyan('    ' + key + ': ') + jsonStringify(text[key]));
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
