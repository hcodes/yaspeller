'use strict';

const chalk = require('chalk');
const fs = require('fs');
const isutf8 = require('isutf8');
const minimatch = require('minimatch');
const pth = require('path');
const stripJsonComments = require('strip-json-comments');
const debug = require('./debug');
const exitCodes = require('./exit-codes');
const printDebug = debug.print;
const isWin = process.platform === 'win32';

module.exports = {
    /**
     * Is directory?
     *
     * @param {string} path
     * @returns {boolean}
     */
    isDir(path) {
        return fs.statSync(path).isDirectory();
    },
    /**
     * Get JSON config.
     *
     * @param {string} file
     * @returns {Object}
     */
    getConfig(file) {
        let data;

        printDebug('Get/check config.');

        try {
            if (file) {
                data = this.loadFileAsJson(file);
            } else {
                data = this.loadFileAsJson('./.yaspellerrc');
                if (!data) {
                    data = this.loadFileAsJson('./.yaspeller.json');
                }
            }

            printDebug('Using config: ' + file);
        } catch (e) {
            console.error(chalk.red(e));
            process.exit(exitCodes.ERROR_CONFIG);
        }

        return data || {};
    },
    /**
     * Load file as JSON with comments.
     *
     * @param {string} file
     * @param {boolean} [throwIfFileNotExists]
     * @returns {*}
     */
    loadFileAsJson(file, throwIfFileNotExists) {
        let data;

        if (fs.existsSync(file)) {
            let json = fs.readFileSync(file);
            if (isutf8(json)) {
                json = json.toString('utf-8');
                if (pth.extname(file) === '.js') {
                    try {
                        data = require(pth.resolve(file));
                    } catch (e) {
                        throw new Error(e);
                    }
                } else {
                    try {
                        json = stripJsonComments(json);
                        data = JSON.parse(json);
                    } catch (e) {
                        throw new Error('Error parsing in the file: ' + file);
                    }
                }
            } else {
                throw new Error(file + ': is not utf-8.');
            }
        } else if (throwIfFileNotExists) {
            throw new Error(file + ': is not exists.');
        }

        return data;
    },
    /**
     * Find files to search for typos.
     *
     * @param {Object[]} dir - Array of typos.
     * @param {string[]} fileExtensions
     * @param {string[]} excludeFiles
     * @returns {Object[]}
     */
    findFiles(dir, fileExtensions, excludeFiles) {
        const result = [];
        const find = path => {
            fs.readdirSync(path).forEach(function(el) {
                const file = pth.resolve(path, el);
                if (!this.isExcludedFile(file, excludeFiles)) {
                    if (this.isDir(file)) {
                        find(file);
                    } else if (this.isReqFileExtension(file, fileExtensions)) {
                        result.push(file);
                    }
                }
            }, this);
        };

        if (this.isDir(dir)) {
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
     * @returns {boolean}
     */
    isReqFileExtension(file, fileExtensions) {
        const buf = fileExtensions.filter(ext => ext.trim());
        return !buf.length || buf.some(ext => ext === file.slice(ext.length * -1));
    },
    /**
     * Is excluded file?
     *
     * @param {string} file
     * @param {string[]} excludeFiles
     * @returns {boolean}
     */
    isExcludedFile(file, excludeFiles) {
        return excludeFiles.some(el => minimatch(file, pth.resolve(el), {dot: true}));
    },
    /**
     * Has english and russian letters?
     *
     * @param {string} text
     * @returns {boolean}
     */
    hasEnRu(text) {
        return text.search(/[a-z]/i) > -1 && text.search(/[а-яё]/i) > -1;
    },
    /**
     * Replace Russian symbols on a asterisk.
     *
     * @param {string} word
     * @returns {string}
     */
    replaceRu(word) {
        return word.replace(/[а-яё]/gi, '*');
    },
    /**
     * Replace Latin symbols on a asterisk.
     *
     * @param {string} word
     * @returns {string}
     */
    replaceEn(word) {
        return word.replace(/[a-z]/gi, '*');
    },
    /**
     * Is url?
     *
     * @param {string} path
     * @returns {boolean}
     */
    isUrl(path) {
        return path.search(/^https?:/) > -1;
    },
    /**
     * Is sitemap?
     *
     * @param {string} path
     * @returns {boolean}
     */
    isSitemap(path) {
        return path.search(/sitemap\.xml$/) > -1;
    },
    /**
     * Get typos by code.
     *
     * @param {number} code
     * @param {Array} data
     * @returns {Array}
     */
    getTyposByCode(code, data) {
        const typos = [];
        data.forEach(function(el) {
            if (el.code !== code) {
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
     * @returns {boolean}
     */
    hasManyErrors(data) {
        return data.some(el => el.code === 4); // ERROR_TOO_MANY_ERRORS
    },
    /**
     * Get uptime in sec.
     * @returns {string}
     */
    uptime() {
        return (Math.floor(process.uptime() * 1000) / 1000) + ' sec.';
    },
    /**
     * Get a array with unique values.
     * @param {Array} arr
     * @returns {Array}
     */
    uniq(arr) {
        return Array.from(new Set(arr));
    },
    /**
     * Converts string to kebab case.
     *
     * @param {string} text
     * @returns {string}
     */
    kebabCase(text) {
        return text.replace(/[A-Z]/g, function($) {
            return '-' + $.toLowerCase();
        });
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
