'use strict';

const chalk = require('chalk');
const debug = require('./debug');
const exitCodes = require('./exit-codes');
const utils = require('./utils');
const printDebug = debug.print;
const letters = '[a-zа-яё\\d-]';
const reNotOptimized = new RegExp('(^|' + letters + ')' +
        '(\\(|\\[)' + letters + '(\\)|\\])(' + letters + '|\\/$|$)', 'i');
const rePrepare = new RegExp('^(' + letters + ')(' + letters + '|$)');

module.exports = {
    /**
     * Set dictionary.
     *
     * @param {Array} files
     * @param {Array} configDictionary - Dictionary from .yaspellerrc
     */
    set(files, configDictionary) {
        let commonUniqueWords = [];
        let count = 0;
        let result = [];

        const prepare = (words, file) => {
            result = result.concat(words);
            this.checkDuplicates(words, `Dictionary duplicate words in "${file}":`);
            this.checkTyposInDictionary(words, file);

            commonUniqueWords = commonUniqueWords.concat(utils.uniq(words));

            count++;
        };

        if (configDictionary) {
            prepare(configDictionary, '.yaspellerrc');
        }

        files && files.forEach(function(file) {
            prepare(this.loadDictionary(file), file);
        }, this);

        if (count > 1) {
            this.checkDuplicates(commonUniqueWords, 'Duplicate words in dictionaries:');
        }

        this._dict = this.prepareDictionary(result);
    },
    /**
     * Get dictionary.
     *
     * @returns {Array}
     */
    get() {
        return this._dict;
    },
    _dict: [],
    /**
     * Load dictionary.
     *
     * @param {string} file - JSON file.
     * @returns {Array}
     */
    loadDictionary(file) {
        let data = [];

        printDebug('Get/check dictionary: ' + file);

        try {
            data = utils.loadFileAsJson(file, true);

            printDebug('Use dictionary: ' + file);
        } catch (e) {
            console.error(chalk.red(e));
            process.exit(exitCodes.ERROR_DICTIONARY);
        }

        return data;
    },
    /**
     * Check duplicate words in dictionary.
     *
     * @param {string[]} words
     * @param {string} title
     * @returns {boolean}
     */
    checkDuplicates(words, title) {
        const duplicates = this.getDuplicates(words);
        if (duplicates.length) {
            console.log(chalk.cyan(title + '\n' + duplicates.join('\n') + '\n'));

            return true;
        }

        return false;
    },
    /**
     * Check typos in dictionary.
     *
     * @param {string[]} words
     * @param {string} file
     * @returns {boolean}
     */
    checkTyposInDictionary(words, file) {
        const typos = [];
        words.forEach(function(word) {
            if (utils.hasEnRu(word)) {
                typos.push(word);
            }
        });

        const hasTypos = typos.length ? true : false;
        if (hasTypos) {
            console.log(chalk.cyan('Has typos in "' + file + '":'));
            typos.forEach(function(typo) {
                console.log(chalk.cyan(typo + ' - en: ' + utils.replaceRu(typo) +
                    ', ru: ' + utils.replaceEn(typo)));
            });
            console.log('');
        }

        return hasTypos;
    },
    /**
     * Remove typos that is in the dictionary.
     *
     * @param {Object[]} data - Array of typos.
     * @returns {Object[]}
     */
    removeDictWords(data) {
        const result = [];
        const dictionary = this.get();

        data.forEach(function(typo) {
            if ((typo.code !== 1 && typo.code !== 3) || this.isTypo(typo.word, dictionary)) {
                result.push(typo);
            }
        }, this);

        return result;
    },
    /**
     * It's a typo?
     *
     * @param {string} word
     * @param {string[]|RegExp[]} dictionary
     * @returns {boolean}
     */
    isTypo(word, dictionary) {
        return !dictionary.some(function(dictWord) {
            return dictWord.test(word);
        });
    },
    /**
     * Prepare dictionary.
     *
     * @param {string[]} dict
     * @returns {Array}
     */
    prepareDictionary(dict) {
        const result = [];
        dict.forEach(function(word) {
            if (this.isNotOptimizedRegExp(word)) {
                console.log(chalk.cyan('Not optimized dictionary RegExp in "' + word + '"'));
            }

            // unknownWord(s)? = unknownWord(s)? and UnknownWord(s)?
            // UnknownWord(s)? = UnknownWord(s)?

            const preparedWord = word.replace(rePrepare, ($, $1, $2) => '[' + $1 + $1.toUpperCase() + ']' + $2);

            try {
                result.push(new RegExp(preparedWord));
            } catch (e) {
                console.error(chalk.red('Incorrect dictionary RegExp in "' + word + '", ' + e));
            }
        }, this);

        return result;
    },
    /**
     * Is not optimized RegExp?
     *
     * @param {string} text
     * @returns {boolean}
     */
    isNotOptimizedRegExp(text) {
        if (text.search(/(\(\)|\[\])/) !== -1) { // /[]Unknownword()/
            return true;
        }

        if (text.search(reNotOptimized) !== -1) { // /Unknow(n)wo[r]d/
            return true;
        }

        return false;
    },
    /**
     * Get duplicate words.
     *
     * @param {string[]} words
     * @returns {string[]}
     */
    getDuplicates(words) {
        const buffer = {};
        const result = [];

        words.forEach(function(word) {
            if (!buffer[word]) {
                buffer[word] = 1;
            } else if (buffer[word] === 1) {
                buffer[word]++;
                result.push(word);
            }
        });

        return result;
    },
    /**
     * Is a letter?
     *
     * @param {string} symbol
     * @returns {boolean}
     */
    isLetter(symbol) {
        return symbol.toLowerCase() !== symbol.toUpperCase();
    },
    /**
     * Is a letter in upper case?
     *
     * @param {string} letter
     * @returns {boolean}
     */
    isUpperCase(letter) {
        return letter === letter.toUpperCase();
    },
    /**
     * Is a letter in lower case?
     *
     * @param {string} letter
     * @returns {boolean}
     */
    isLowerCase(letter) {
        return letter === letter.toLowerCase();
    }
};
