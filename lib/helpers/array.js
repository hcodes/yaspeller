/**
 * Get a array with unique values.
 * 
 * @param {Array} arr
 * @returns {Array}
 */
function uniq(arr) {
    return Array.from(new Set(arr));
}

/**
 * Get a array with not unique values.
 * 
 * @param {Array} arr
 * @returns {Array}
 */
function notUniq(arr) {
    const buffer = {};
    const result = [];

    arr.forEach(item => {
        if (!buffer[item]) {
            buffer[item] = 1;
        } else if (buffer[item] === 1) {
            buffer[item]++;
            result.push(item);
        }
    });

    return result;
}

module.exports = {
    uniq,
    notUniq,
};
