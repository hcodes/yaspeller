/**
 * Get a array with unique values.
 * 
 * @param {Array} arr
 * @returns {Array}
 */
function uniq(arr) {
    return Array.from(new Set(arr));
}

module.exports = {
    uniq,
};
