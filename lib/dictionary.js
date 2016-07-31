'use strict';

var chalk = require('chalk'),
    _ = require('lodash'),
    debug = require('./debug'),
    exitCodes = require('./exit-codes'),
    utils = require('./utils'),
    printDebug = debug.print,
    letters = '[a-zа-яё\\d-]',
    reNotOptimized = new RegExp('(^|^\\/|' + letters + ')' +
        '(\\(|\\[)' + letters + '(\\)|\\])(' + letters + '|\\/$|$)', 'i'),
    rePrepare = new RegExp('(^\\/|^)(' + letters + ')(' + letters + '|$)');

module.exports = {
    /**
     * Set dictionary.
     *
     * @param {Array} files
     * @param {Array} configDictionary - Dictionary from .yaspellerrc
     */
    set: function(files, configDictionary) {
        var result = [],
            count = 0,
            commonUniqueWords = [],
            that = this;

        function prepare(words, file) {
            result = result.concat(words);
            that.checkDuplicates(words, 'Dictionary duplicate words in "' + file + '":');
            that.checkTyposInDictionary(words, file);

            commonUniqueWords = commonUniqueWords.concat(_.uniq(words));

            count++;
        }

        if(configDictionary) {
            prepare(configDictionary, '.yaspellerrc');
        }

        files && files.forEach(function(file) {
            prepare(this.loadDictionary(file), file);
        }, this);

        if(count > 1) {
            this.checkDuplicates(commonUniqueWords, 'Duplicate words in dictionaries:');
        }

        this._dict = this.prepareDictionary(result);
    },
    /**
     * Get dictionary.
     *
     * @return {Array}
     */
    get: function() {
        return this._dict;
    },
    _dict: [],
    /**
     * Load dictionary.
     *
     * @param {string} file - JSON file.
     * @return {Array}
     */
    loadDictionary: function(file) {
        var data = [];

        printDebug('Get/check dictionary: ' + file);

        try {
            data = utils.loadFileAsJson(file, true);

            printDebug('Use dictionary: ' + file);
        } catch(e) {
            console.error(chalk.red(e));
            process.exit(exitCodes.ERROR_DICTIONARY);
        }

        return data;
    },
    /**
     * Check duplicate words in dictionary.
     *
     * @param {string[]} words
     * @return {boolean}
     */
    checkDuplicates: function(words, title) {
        var duplicates = this.getDuplicates(words);
        if(duplicates.length) {
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
     * @return {boolean}
     */
    checkTyposInDictionary: function(words, file) {
        var typos = [];
        words.forEach(function(word) {
            if(utils.hasEnRu(word)) {
                typos.push(word);
            }
        });

        var hasTypos = typos.length ? true : false;
        if(hasTypos) {
            console.log(chalk.cyan('Has typos in "' + file + '":'));
            typos.forEach(function(typo) {
                console.log(chalk.cyan(typo + ' - en: ' + utils.replaceEn(typo) +
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
     * @return {Object[]}
     */
    removeDictWords: function(data) {
        var result = [],
            dictionary = this.get();

        data.forEach(function(typo) {
            if((typo.code !== 1 && typo.code !== 3) || this.isTypo(typo.word, dictionary)) {
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
     * @return {boolean}
     */
    isTypo: function(word, dictionary) {
        return !dictionary.some(function(dictWord) {
            return dictWord.test(word);
        });
    },
    /**
     * Prepare dictionary.
     *
     * @param {string[]} dict
     * @return {Array}
     */
    prepareDictionary: function(dict) {
        var result = [];
        dict.forEach(function(word) {
            if(this.isNotOptimizedRegExp(word)) {
                console.log(chalk.cyan('Not optimized dictionary RegExp in "' + word + '"'));
            }

            // /unknownWord(s)?/ = /unknownWord(s)?/ and /UnknownWord(s)?/
            // /UnknownWord(s)?/ = /UnknownWord(s)?/

            var preparedWord = word.replace(rePrepare, function($, $1, $2, $3) {
                return $1 + '[' + $2 + $2.toUpperCase() + ']' + $3;
            });

            try {
                if(word.search(/^\/.+\/i?$/) !== -1) {
                    // Old format
                    result.push(this.parseRegExpOldFormat(preparedWord));
                } else {
                    result.push(new RegExp(preparedWord));
                }
            } catch(e) {
                console.error(chalk.red('Incorrect dictionary RegExp in "' + word + '", ' + e));
            }
        }, this);

        return result;
    },
    /**
     * Is not optimized RegExp?
     *
     * @param {string} text
     * @return {boolean}
     */
    isNotOptimizedRegExp: function(text) {
        if(text.search(/(\(\)|\[\])/) !== -1) { // /[]Unknownword()/
            return true;
        }

        if(text.search(reNotOptimized) !== -1) { // /Unknow(n)wo[r]d/
            return true;
        }

        return false;
    },
    /**
     * Get duplicate words.
     *
     * @param {string[]} words
     * @return {string[]}
     */
    getDuplicates: function(words) {
        var buffer = {},
            result = [];

        words.forEach(function(word) {
            if(!buffer[word]) {
                buffer[word] = 1;
            } else if(buffer[word] === 1) {
                buffer[word]++;
                result.push(word);
            }
        });

        return result;
    },
    /**
     * Parse RegExp old format.
     *
     * @param {string} text
     * @return {RegExp}
     */
    parseRegExpOldFormat: function(text) {
        var buf = text.split('\/');
        return new RegExp('^' + buf[1] + '$', buf[2] || '');
    },
    /**
     * Is a letter?
     *
     * @param {string} symbol
     * @return {boolean}
     */
    isLetter: function(symbol) {
        return symbol.toLowerCase() !== symbol.toUpperCase();
    },
    /**
     * Is a letter in upper case?
     *
     * @param {string} letter
     * @return {boolean}
     */
    isUpperCase: function(letter) {
        return letter === letter.toUpperCase();
    },
    /**
     * Is a letter in lower case?
     *
     * @param {string} letter
     * @return {boolean}
     */
    isLowerCase: function(letter) {
        return letter === letter.toLowerCase();
    }
};
