/*jshint maxlen:1000 */
var program = require('commander'),
    _ = require('lodash');

function splitTrim(value, separator) {
    return value.split(separator).map(function(el) {return el.trim()});
}

function splitByCommas(value) {
    return splitTrim(value, ',');
}

module.exports = {
    set: function(prefs) {
        program
            .version(require('../package.json').version)
            .usage('[options] <file-or-directory-or-link...>')
            .option('-l, --lang <value>', 'languages: en, ru or uk. Default: "en,ru"')
            .option('-f, --format <value>', 'formats: plain, html, markdown or auto. Default: auto')
            .option('-c, --config <path>', 'configuration file path')
            .option('-e, --file-extensions <value>', 'set file extensions to search for files in a folder. Example: ".md,.html"', splitByCommas, null)
            .option('--dictionary <file>', 'json file for own dictionary', function(value) {
                return splitTrim(value, ':');
            }, [])
            .option('--no-colors', 'clean output without colors')
            .option('--report <type>', 'generate a report: console, text, html or json. Default: console', splitByCommas, null)
            .option('--ignore-tags <tags>', 'ignore tags. Default: "' +
                prefs.defaultIgnoreTags +
                '"', splitByCommas, null)
            .option('--max-requests <number>', 'max count of requests at a time. Default: 2', parseInt, 0)
            .option('--only-errors', 'output only errors')
            .option('--debug', 'debug mode')
            .option('--check-yo', 'checking the letter Ё (Yo) in words.');

        this.apiOptions.forEach(function(el) {
            program.option('--' + _.kebabCase(el[0]), el[1]);
        });
    },
    apiOptions: [
        ['byWords', 'do not use a dictionary environment (context) during the scan. This is useful in cases where the service is transmitted to the input of a list of individual words'],
        ['findRepeatWords', 'highlight repetitions of words, consecutive. For example, "I flew to to to Cyprus"'],
        ['flagLatin', 'celebrate words, written in Latin, as erroneous'],
        ['ignoreCapitalization', 'ignore the incorrect use of UPPERCASE / lowercase letters, for example, in the word "moscow"'],
        ['ignoreDigits', 'ignore words with numbers, such as "avp17h4534"'],
        ['ignoreLatin', 'ignore words, written in Latin, for example, "madrid"'],
        ['ignoreRomanNumerals', 'ignore Roman numerals ("I, II, III, ...")'],
        ['ignoreUrls', 'ignore Internet addresses, email addresses and filenames'],
        ['ignoreUppercase', 'ignore words written in capital letters']
    ]
};
