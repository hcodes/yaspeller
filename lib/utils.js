var chalk = require('chalk'),
    fs = require('fs'),
    minimatch = require('minimatch'),
    pth = require('path'),
    stripJsonComments = require('strip-json-comments'),
    debug = require('./debug'),
    exitCodes = require('./exit-codes'),
    printDebug = debug.print,
    isWin = process.platform === 'win32';

function loadConfig(file) {
    var data;

    if(fs.existsSync(file)) {
        try {
            var config = fs.readFileSync(file, 'utf8');
            if(['.js', '.json'].indexOf(pth.extname(file)) === -1) {
                config = stripJsonComments(config);
            }

            data = JSON.parse(config);

            printDebug('Using config: ' + file);
        } catch(e) {
            console.error(chalk.red('Error parsing ' + file));
            process.exit(exitCodes.ERROR_CONFIG);
        }
    }

    return data;
}

module.exports = {
    /**
     * Is directory?
     *
     * @param {string} path
     * @return {boolean}
     */
    isDir: function(path) {
        return fs.statSync(path).isDirectory();
    },
    /**
     * Get JSON config.
     *
     * @param {string} file
     * @return {Object}
     */
    getConfig: function(file) {
        var data;

        printDebug('get/check JSON config');

        if(file) {
            data = loadConfig(file);
        } else {
            data = loadConfig('./.yaspellerrc');
            if(!data) {
                data = loadConfig('./.yaspeller.json');
            }
        }

        return data || {};
    },
    /**
     * Find files to search for typos.
     *
     * @param {Object[]} dir - Array of typos.
     * @param {string[]} fileExtensions
     * @param {string[]} excludeFiles
     * @return {Object[]}
     */
    findFiles: function(dir, fileExtensions, excludeFiles) {
        var result = [],
            find = function(path) {
                fs.readdirSync(path).forEach(function(el) {
                    var file = pth.resolve(path, el);
                    if(!this.isExcludedFile(file, excludeFiles)) {
                        if(this.isDir(file)) {
                            find(file);
                        } else if(this.isReqFileExtension(file, fileExtensions)) {
                            result.push(file);
                        }
                    }
                }, this);
            }.bind(this);

        if(this.isDir(dir)) {
            find(dir);
        } else {
            result.push(dir);
        }

        return result;
    },
    /**
     * Is required file extension?
     *
     * @param {string} file
     * @param {string[]} fileExtensions
     *
     * @return {boolean}
     */
    isReqFileExtension: function(file, fileExtensions) {
        var ext = pth.extname(file);
        return !fileExtensions.length ||
            (fileExtensions.length === 1 && !fileExtensions[0]) ||
            fileExtensions.indexOf(ext) !== -1;
    },
    /**
     * Is excluded file?
     *
     * @param {string} file
     * @param {string[]} excludeFiles
     *
     * @return {boolean}
     */
    isExcludedFile: function(file, excludeFiles) {
        return excludeFiles.some(function(el) {
            return minimatch(file, pth.resolve(el), {dot: true});
        });
    },
    /**
     * Has english and russian letters?
     *
     * @param {string} text
     *
     * @return {boolean}
     */
    hasEnRu: function(text) {
        return text.search(/[a-z]/i) > -1 && text.search(/[а-яё]/i) > -1;
    },
    /**
     * Replace Russian symbols on a asterisk.
     *
     * @param {string} word
     *
     * @return {string}
     */
    replaceRu: function(word) {
        return word.replace(/[а-яё]/gi, '*');
    },
    /**
     * Replace Latin symbols on a asterisk.
     *
     * @param {string} word
     *
     * @return {string}
     */
    replaceEn: function(word) {
        return word.replace(/[a-z]/gi, '*');
    },
    /**
     * Is url?
     *
     * @param {string} path
     *
     * @return {boolean}
     */
    isUrl: function(path) {
        return path.search(/^https?:/) > -1;
    },
    /**
     * Is sitemap?
     *
     * @param {string} path
     *
     * @return {boolean}
     */
    isSitemap: function(path) {
        return path.search(/sitemap\.xml$/) > -1;
    },
    /**
     * Get typos by code.
     *
     * @param {number} code
     * @param {Array} data
     *
     * @return {Array}
     */
    getTyposByCode: function(code, data) {
        var typos = [];
        data.forEach(function(el) {
            if(el.code !== code) {
                return;
            }

            typos.push(el);
        });

        return typos;
    },
    /**
     * Has many errors.
     *
     * @param {Array} data
     *
     * @return {boolean}
     */
    hasManyErrors: function(data) {
        return data.some(function(el) {
            return el.code === 4; // ERROR_TOO_MANY_ERRORS
        });
    },
    /**
     * Get uptime in sec.
     *
     * @return {string}
     */
    uptime: function() {
        return (Math.floor(process.uptime() * 1000) * 1000) + ' sec.';
    },
    /**
     * Ok symbol.
     *
     * @type {string}
     */
    okSym: isWin ? '[OK]' : '✓',
    /**
     * Error symbol.
     *
     * @type {string}
     */
    errSym: isWin ? '[ERR]' : '✗'
};
