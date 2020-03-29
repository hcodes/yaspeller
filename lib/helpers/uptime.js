'use strict';

/**
 * Get uptime in sec.
 * 
 * @returns {string}
 */
function uptime() {
    return (Math.floor(process.uptime() * 1000) / 1000) + ' sec.';
}

module.exports = {
    uptime,
};
