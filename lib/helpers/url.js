/**
 * Is url?
 *
 * @param {string} path
 * @returns {boolean}
 */
function isUrl(path) {
    return path.search(/^https?:/) > -1;
}

/**
 * Is sitemap?
 *
 * @param {string} path
 * @returns {boolean}
 */
function isSitemap(path) {
    return path.search(/sitemap\.xml$/) > -1;
}

module.exports = {
    isSitemap,
    isUrl,
};
