var chalk = require('chalk'),
    util = require('util'),
    debug = require('./debug'),
    exitCodes = require('./exit-codes'),
    utils = require('./utils'),
    printDebug = debug.print;

function isTypo(word, dictionary) {
    return !dictionary.some(function(dictWord) {
        return util.isRegExp(dictWord) ? dictWord.test(word) : word === dictWord;
    });
}

module.exports = {
    /**
     * Get dictionary.
     *
     * @param {Array} files
     * @param {Array} dictionary - Dictionary from .yaspellerrc
     * @return {Array}
     */
    getDictionary: function(files, dictionary) {
        var result = [];

        if(dictionary) {
            result = dictionary;
        }

        files && files.forEach(function(file) {
            result = result.concat(this.loadDictionary(file));
        }, this);

        return this.prepareDictionary(result);
    },
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
     * Remove typos that is in the dictionary.
     *
     * @param {Object[]} data - Array of typos.
     * @param {string[]|RegExp[]} dictionary
     * @return {Object[]}
     */
    removeDictWords: function(data, dictionary) {
        var result = [];

        data.forEach(function(typo) {
            if((typo.code !== 1 && typo.code !== 3) || isTypo(typo.word, dictionary)) {
                result.push(typo);
            }
        });

        return result;
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
            if(word.search(/^\/.+\/i?$/) !== -1) {
                try {
                    result.push(this.parseRegExp(word));
                } catch(e) {
                    console.error(chalk.red('Incorrect RegExp "' + word + '", ' + e));
                }
            } else {
                result.push(word);
            }
        }, this);

        return result;
    },
    /**
     * Parse RegExp.
     *
     * @param {string} text
     * @return {RegExp}
     */
    parseRegExp: function(text) {
        var buf = text.split('\/');
        return new RegExp('^' + buf[1] + '$', buf[2] || '');
    }
};
