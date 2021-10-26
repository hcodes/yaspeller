'use strict';

const program = require('commander');

const { getMergedConfig } = require('../config');

const { prepareRegExpToIgnoreText } = require('../helpers/ignore');
const { kebabCase, splitTrim, splitByCommas } = require('../helpers/string');
const { packageJson } = require('../helpers/package');

const apiOptions = [
    ['byWords', 'do not use a dictionary environment (context) during the scan. This is useful in cases where the service is transmitted to the input of a list of individual words'],
    ['findRepeatWords', 'highlight repetitions of words, consecutive. For example, "I flew to to to Cyprus"'],
    ['flagLatin', 'celebrate words, written in Latin, as erroneous'],
    ['ignoreCapitalization', 'ignore the incorrect use of UPPERCASE / lowercase letters, for example, in the word "moscow"'],
    ['ignoreDigits', 'ignore words with numbers, such as "avp17h4534"'],
    ['ignoreLatin', 'ignore words, written in Latin, for example, "madrid"'],
    ['ignoreRomanNumerals', 'ignore Roman numerals ("I, II, III, ...")'],
    ['ignoreUrls', 'ignore Internet addresses, email addresses and filenames'],
    ['ignoreUppercase', 'ignore words written in capital letters']
];

function setCliOptions(defaultConfig) {
    program
        .version(packageJson.version)
        .usage('[options] <file-or-directory-or-link...>')
        .option('-l, --lang <value>', `languages: en, ru or uk. Default: "${defaultConfig.lang}"`)
        .option('-f, --format <value>', `formats: plain, html, markdown or auto. Default: "${defaultConfig.format}"`)
        .option('-c, --config <path>', 'configuration file path')
        .option('-e, --file-extensions <value>', 'set file extensions to search for files in a folder. Example: ".md,.html"', splitByCommas)
        .option('--init', 'save default config ".yaspellerrc" in current directory')
        .option('--dictionary <file>', 'json file for own dictionary', value => splitTrim(value, ':'))
        .option('--no-color', 'clean output without colors')
        .option('--report <type>', 'generate a report: console, text, html or json. Default: "console"', splitByCommas)
        .option('--ignore-tags <tags>', `ignore tags. Default: "${defaultConfig.ignoreTags.join(',')}"`, splitByCommas)
        .option('--ignore-text <regexp>', 'ignore text using RegExp')
        .option('--stdin', 'process files on <STDIN>')
        .option('--stdin-filename <file>', 'specify filename to process STDIN as')
        .option('--max-requests <number>', `max count of requests at a time. Default: ${defaultConfig.maxRequests}`, parseInt)
        .option('--only-errors', 'output only errors')
        .option('--check-yo', 'checking the letter Ё (Yo) in words')
        .option('--debug', 'debug mode');

    apiOptions.forEach(option => {
        const [name, description] = option;

        program.option('--' + kebabCase(name), description);
    });
}

function getMergedOptions(config) {
    const mergedConfig = getMergedConfig(config);

    const mergedOptions = {
        excludeFiles: mergedConfig.excludeFiles,
        options: mergedConfig.options || {},

        configDictionary: mergedConfig.dictionary,
        configRelativePath: mergedConfig.configRelativePath,
    };

    [
        'checkYo',
        'fileExtensions',
        'format',
        'ignoreTags',
        'ignoreText',
        'lang',
        'maxRequests',
        'report',
    ].forEach(function(key) {
        mergedOptions[key] = program[key] || mergedConfig[key];
    });

    mergedOptions.ignoreText = prepareRegExpToIgnoreText(mergedOptions.ignoreText);

    apiOptions.forEach(option => {
        const key = option[0];
        if (program[key]) {
            mergedOptions.options[key] = true;
        } else if (typeof mergedConfig[key] !== 'undefined') {
            mergedOptions.options[key] = mergedConfig[key];
        }
    });

    return mergedOptions;
}

module.exports = {
    apiOptions,
    getMergedOptions,
    setCliOptions,
};
