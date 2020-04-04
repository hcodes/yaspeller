'use strict';

const { ERROR_TOO_MANY_ERRORS } = require('yandex-speller');

const exitCodes = require('./exit-codes');

const { replaceRusLettersWithAsterisk } = require('./helpers/string');
const { hasEngRusLetters, replaceEngLettersWithAsterisk } = require('./helpers/string');
const { loadFileAsJson } = require('./helpers/file');
const { uniq, notUniq } = require('./helpers/array');
const { consoleError, consoleWarn, consoleLog, consoleDebug } = require('./helpers/console');

const letters = '[a-zа-яё\\d-]';
const reNotOptimized = new RegExp('(^|' + letters + ')' +
        '(\\(|\\[)' + letters + '(\\)|\\])(' + letters + '|\\/$|$)', 'i');
const rePrepare = new RegExp('^(' + letters + ')(' + letters + '|$)');

class Dictionary {
    constructor() {
        this.dict = [];
    }
    /**
     * Set dictionary.
     *
     * @param {string[]} words
     */
    set(words) {
        this.dict = this.prepareDictionaryWords(words);
    }

    /**
     * Get dictionary.
     *
     * @returns {RegExp[]}
     */
    get() {
        return this.dict;
    }

    /**
     * Load dictionary.
     *
     * @param {string} file - JSON file.
     * @returns {string[]}
     */
    loadDictionary(file) {
        let data = [];

        consoleDebug(`Get/check dictionary: ${file}`);

        try {
            data = loadFileAsJson(file, true);

            consoleDebug(`Use dictionary: ${file}`);
        } catch (e) {
            consoleError(e);
            process.exit(exitCodes.ERROR_DICTIONARY);
        }

        return data;
    }

    /**
     * Load dictionaries.
     *
     * @param {string[]} files
     * @param {string[]} configDictionary - Dictionary from .yaspellerrc
     */
    loadDictionaries(files, configDictionary) {
        let count = 0;
        let result = [];

        const prepare = (words, file) => {
            result = result.concat(uniq(words));
            this.checkDuplicateWords(words, `Dictionary duplicate words in "${file}":`);
            this.checkTyposInDictionary(words, file);

            count++;
        };

        if (configDictionary) {
            prepare(configDictionary, '.yaspellerrc');
        }

        files && files.forEach(file => {
            prepare(this.loadDictionary(file), file);
        });

        if (count >= 2) {
            this.checkDuplicateWords(result, 'Duplicate words in dictionaries:');
        }

        this.set(result);
    }

    /**
     * Check duplicate words in dictionary.
     *
     * @param {string[]} words
     * @param {string} title
     * @returns {boolean}
     */
    checkDuplicateWords(words, title) {
        const duplicates = notUniq(words);
        if (duplicates.length) {
            consoleWarn(title + '\n' + duplicates.join('\n') + '\n');

            return true;
        }

        return false;
    }

    /**
     * Check typos in dictionary.
     *
     * @param {string[]} words
     * @param {string} file
     * @returns {boolean}
     */
    checkTyposInDictionary(words, file) {
        const typos = [];
        words.forEach(item => {
            if (hasEngRusLetters(item)) {
                typos.push(item);
            }
        });

        const hasTypos = Boolean(typos.length);
        if (hasTypos) {
            consoleWarn(`Has typos in "${file}":`);
            typos.forEach(item => {
                consoleWarn(item +
                    ' - en: ' + replaceRusLettersWithAsterisk(item) +
                    ', ru: ' + replaceEngLettersWithAsterisk(item)
                );
            });
            consoleLog('');
        }

        return hasTypos;
    }

    /**
     * Remove typos that is in the dictionary.
     *
     * @param {Object[]} data - Array of typos.
     * @returns {Object[]}
     */
    removeDictionaryWordsFromData(data) {
        const result = [];
        const dictionary = this.get();

        data.forEach(typo => {
            if (typo.code === ERROR_TOO_MANY_ERRORS || this.isTypo(typo.word, dictionary)) {
                result.push(typo);
            }
        });

        return result;
    }

    /**
     * It's a typo?
     *
     * @param {string} word
     * @param {RegExp[]} dictionary
     * @returns {boolean}
     */
    isTypo(word, dictionary) {
        return !dictionary.some(item => item.test(word));
    }

    /**
     * Prepare dictionary words.
     *
     * @param {string[]} dictionaryWords
     * @returns {RegExp[]}
     */
    prepareDictionaryWords(dictionaryWords) {
        const result = [];

        dictionaryWords.forEach(word => {
            if (this.isNotOptimizedRegExp(word)) {
                consoleWarn(`Not optimized dictionary RegExp in "${word}"`);
            }

            // unknownWord(s)? = unknownWord(s)? and UnknownWord(s)?
            // UnknownWord(s)? = UnknownWord(s)?

            let preparedWord = word.replace(rePrepare, ($, $1, $2) => '[' + $1 + $1.toUpperCase() + ']' + $2);

            if (preparedWord.search(/\^/) !== 0) {
                preparedWord = '^' + preparedWord;
            }

            if (preparedWord.search(/\$/) !== preparedWord.length - 1) {
                preparedWord += '$';
            }

            try {
                result.push(new RegExp(preparedWord));
            } catch (e) {
                consoleError(`Incorrect dictionary RegExp in "${word}", ${e}`);
            }
        });

        return result;
    }

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
    }
}

module.exports = new Dictionary();
