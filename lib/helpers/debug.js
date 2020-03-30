'use strict';

let isDebugMode = false;

/**
 * Set debug mode.
 *
 * @param {boolean} val
 */
function setDebugMode(val) {
    isDebugMode = val;
}

module.exports = {
    isDebugMode() { return isDebugMode; },
    setDebugMode,
};
