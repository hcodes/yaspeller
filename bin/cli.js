#!/usr/bin/env node
/* jshint maxlen: 500 */
var fs = require('fs'),
    async = require('async'),
    chalk = require('chalk'),
    isutf8 = require('isutf8'),
    program = require('commander'),
    yaspeller = require('../lib/yaspeller'),
    mDebug = require('../lib/debug'),
    printDebug = mDebug.print,
    startTime = Date.now(),
    dictionary = [],
    settings = {},
    jsonConfig = {},
    hasTypos = false,
    json = require('../.yaspellerrc.default.json'),
    defaultFileExtensions = json.fileExtensions.join(',');

function getTypos(data) {
    var buf = [];
    data.forEach(function(el) {
        var find = false;

        if(el.code === 1) { // ERROR_UNKNOWN_WORD
            dictionary.some(function(el2) {
                if(el2 === el.word) {
                    find = true;
                }

                return find;
            });
        }

        if(!find) {
            buf.push(el.word);
        }
    });

    var obj = {};
    buf.forEach(function(word) {
        if(!obj[word]) {
            obj[word] = {
                count: 0,
                comment: []
            };

            if(word.search(/[a-z]/i) > -1 && word.search(/[а-яё]/i) > -1) {
                obj[word].comment = [
                    chalk.red('en: ' + word.replace(/[а-яё]/gi, '*')),
                    chalk.green('ru: ' + word.replace(/[a-z]/gi, '*'))
                ];
            }
        }

        obj[word].count++;
    });

    var typos = [];
    Object.keys(obj).forEach(function(w) {
        var comment = [],
            item = obj[w];
        if(item.count > 1) {
            comment.push(chalk.cyan('count: ' + item.count));
        }

        if(item.comment.length) {
            comment = comment.concat(item.comment);
        }

        typos.push(w + (comment.length ? ' (' + comment.join(', ') + ')' : ''));
    });

    return typos;
}

function getRepeatWords(data) {
    var words = [];
    data.forEach(function(el) {
        if(el.code === 2) { // ERROR_REPEAT_WORD
            words.push(el.word);
        }
    });

    return words;
}

function getCapitalisation(data) {
    var words = [];
    data.forEach(function(el) {
        if(el.code === 3) { // ERROR_CAPITALIZATION
            words.push(el.word);
        }
    });

    return words;
}

function hasManyErrors(data) {
    var hasErr = false;
    data.some(function(el) {
        if(el.code === 4) { // ERROR_TOO_MANY_ERRORS
            hasErr = true;
            return true;
        }
        return false;
    });

    return hasErr;
}

function getTextError(title, words) {
    var SEPARATOR = '\n-----';

    words.forEach(function(val, i) {
        words[i] = (i + 1) + '. ' + words[i];
    });

    return chalk.red(title + ': ' + words.length + SEPARATOR + '\n') + words.join('\n') + chalk.red(SEPARATOR) + '\n';
}

function buildResource(err, data) {
    if(err) {
        console.error(chalk.red(data));
    } else {
        var typos = getTypos(data.data),
            repeatWords = getRepeatWords(data.data),
            capitalization = getCapitalisation(data.data),
            textErrors = [];

        if(hasManyErrors(data.data)) {
            textErrors.push(chalk.red('Too many errors'));
        }

        if(repeatWords.length) {
            textErrors.push(getTextError('Repeat words', repeatWords));
        }

        if(capitalization.length) {
            textErrors.push(getTextError('Capitalization', capitalization));
        }

        if(typos.length) {
            textErrors.push(getTextError('Typos', typos));
        }

        var time = data.time ? ' ' + chalk.magenta(data.time + ' ms') : '';
        if(textErrors.length) {
            hasTypos = true;
            console.error(chalk.red('[ERR]') +  ' ' + data.resource + time);
            console.error(textErrors.join('\n') + '\n');
        } else if(!program.onlyErrors) {
            console.log(chalk.green('[OK]') + ' ' + data.resource + time);
        }
    }
}

function splitOnCommas(val) {
    return val.split(',');
}

var options = [
    ['ignoreUppercase', 'ignore words written in capital letters'],
    ['ignoreDigits', 'ignore words with numbers, such as "avp17h4534"'],
    ['ignoreUrls', 'ignore Internet addresses, email addresses and filenames'],
    ['findRepeatWords', 'highlight repetitions of words, consecutive. For example, "I flew to to to Cyprus"'],
    ['ignoreLatin', 'ignore words, written in Latin, for example, "madrid"'],
    ['flagLatin', 'celebrate words, written in Latin, as erroneous'],
    ['byWords', 'do not use a dictionary environment (context) during the scan. This is useful in cases where the service is transmitted to the input of a list of individual words'],
    ['ignoreCapitalization', 'ignore the incorrect use of UPPERCASE / lowercase letters, for example, in the word "moscow"'],
    ['ignoreRomanNumerals', 'ignore Roman numerals ("I, II, III, ...")']
];

program
    .version(require('../package.json').version)
    .usage('[options] <file-or-directory-or-link...>')
    .option('-l, --lang <value>', 'languages: en, kk, ru or uk. Default: "en,ru"')
    .option('-f, --format <value>', 'formats: plain, html or auto. Default: auto')
    .option('-c, --config <path>', 'configuration file path')
    .option('--file-extensions <value>', 'set file extensions to search for files in a folder. Default: "' + defaultFileExtensions + '"', splitOnCommas, null)
    .option('--dictionary <file>', 'json file for own dictionary')
    .option('--no-colors', 'clean output without colors')
    .option('--max-requests <number>', 'max count of requests at a time. Default: 2', parseInt, 0)
    //.option('--report', 'generate html report - ./yaspeller.html')
    .option('--only-errors', 'output only errors')
    .option('--debug', 'debug mode');

options.forEach(function(el) {
    program.option('--' + el[0].replace(/([A-Z])/g, '-$1').toLowerCase(), el[1]);
});

program.parse(process.argv);

if(!program.args.length) {
    program.help();
}

printDebug('get/check JSON config');
var jsonConfigFilename = program.config || './.yaspellerrc';
if(fs.existsSync(jsonConfigFilename)) {
    try {
        jsonConfig = JSON.parse(fs.readFileSync(jsonConfigFilename));
        printDebug('Using config: ' + jsonConfigFilename);
    } catch(e) {
        console.error(chalk.red('Error parsing ' + jsonConfigFilename));
        process.exit(2);
    }
}

Object.keys(jsonConfig).forEach(function(key) {
    json[key] = jsonConfig[key];
});

chalk.enabled = program.colors;

mDebug.setDebug(program.debug);

yaspeller.setParams({
    maxRequests: program.maxRequests || json.maxRequests || 2,
    fileExtensions: program.fileExtensions || json.fileExtensions,
    excludeFiles: json.excludeFiles
});

settings.lang = program.lang || json.lang;
settings.format = program.format || json.format;
settings.options = json.options || {};

options.forEach(function(el) {
    var key = el[0];
    if(program[key]) {
        settings.options[key] = true;
    } else if(typeof json[key] !== 'undefined') {
        settings.options[key] = json[key];
    }
});

if(program.debug) {
    Object.keys(settings.options).forEach(function(key) {
        printDebug('option "' + key + '" is true');
    });
}

if(json.dictionary) {
    dictionary = json.dictionary;
}

if(program.dictionary) {
    if(fs.existsSync(program.dictionary)) {
        printDebug('get/check dictionary: ' + program.dictionary);
        try {
            var bufDict = fs.readFileSync(program.dictionary);
            if(!isutf8(bufDict)) {
                console.error(program.dictionary + ': is not utf-8');
                process.exit(2);
            }
            dictionary = JSON.parse(bufDict.toString('utf-8'));
            printDebug('use dictionary: ' + program.dictionary);
        } catch(e) {
            console.error(program.dictionary + ': error parsing JSON');
            process.exit(2);
        }
    } else {
        console.error(program.dictionary + ': is not exists');
        process.exit(2);
    }
}

var hasErrors = false,
    tasks = [],
    onResource = function(err, data) {
        if(err) {
            hasErrors = true;
        }

        buildResource(err, data);
    };

program.args.forEach(function(resource) {
    tasks.push(function(cb) {
        if(resource.search(/^https?:/) > -1) {
            if(resource.search(/sitemap\.xml$/) > -1) {
                yaspeller.checkSitemap(resource, function() {
                    cb();
                }, settings, onResource);
            } else {
                yaspeller.checkUrl(resource, function(err, data) {
                    onResource(err, data);
                    cb();
                }, settings);
            }
        } else {
            if(fs.existsSync(resource)) {
                if(fs.statSync(resource).isDirectory()) {
                    yaspeller.checkDir(resource, function() {
                        cb();
                    }, settings, onResource);
                } else {
                    yaspeller.checkFile(resource, function(err, data) {
                        onResource(err, data);
                        cb();
                    }, settings);
                }
            } else {
                onResource(true, Error(resource + ': is not exists'));
                cb();
            }
        }
    });
});

async.series(tasks, function() {
    if(!program.onlyErrors) {
        if(!hasErrors && !hasTypos) {
            console.log(chalk.green('No errors.'));
        }

        console.log(chalk.magenta('Checking finished: ' + ((+new Date() - startTime) / 1000) + ' sec.'));
    }

    process.exit(hasErrors ? 1 : 0);
});
