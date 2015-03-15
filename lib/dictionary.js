var fs = require('fs'),
    isutf8 = require('isutf8'),
    debug = require('../lib/debug'),
    util = require('util'),
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
     * @param {string} file - JSON file.
     * @return {Array}
     */
    getDictionary: function(file) {
        /* istanbul ignore next */
        if(fs.existsSync(file)) {
            printDebug('get/check dictionary: ' + file);
            try {
                var bufDict = fs.readFileSync(file);
                if(!isutf8(bufDict)) {
                    console.error(file + ': is not utf-8');
                    process.exit(2);
                }

                printDebug('use dictionary: ' + file.dictionary);

                return JSON.parse(bufDict.toString('utf-8'));
            } catch(e) {
                console.error(file + ': error parsing JSON');
                process.exit(2);
            }
        } else {
            console.error(file + ': is not exists');
            process.exit(2);
        }

        /* istanbul ignore next */
        return [];
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
                    console.error('Incorrect RegExp "' + word + '", ' + e);
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
