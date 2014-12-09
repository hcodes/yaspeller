#!/usr/bin/env node

var fs = require('fs'),
    chalk = require('chalk'),
    isutf8 = require('isutf8'),
    program = require('commander'),
    Q = require('q'),
    yaspeller = require('../lib/yaspeller'),
    mDebug = require('../lib/debug'),
    printDebug = mDebug.print,
    startTime = Date.now(),
    dictionary = [],
    settings = {},
    jsonAtDir = {},
    json = JSON.parse(fs.readFileSync(__dirname + '/../.yaspellerrc.default.json', 'utf-8')),
    jsonAtDirFilename = './.yaspellerrc';

function getTypos(data) {
    var buf = [];
    data.forEach(function(el) {
        var find = false;
        // ERROR_UNKNOWN_WORD: Слова нет в словаре
        if(el.code === 1) {
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
        // ERROR_REPEAT_WORD: Повтор слова
        if(el.code === 2) {
            words.push(el.word);
        }
    });

    return words;
}

function getCapitalisation(data) {
    var words = [];
    data.forEach(function(el) {
        // ERROR_CAPITALIZATION: Неверное употребление прописных и строчных букв
        if(el.code === 3) {
            words.push(el.word);
        }
    });

    return words;
}

function hasManyErrors(data) {
    var hasErrors = false;
    data.some(function(el) {
        // ERROR_TOO_MANY_ERRORS: Текст содержит слишком много ошибок
        if(el.code === 4) {
            hasErrors = true;
            return true;
        }
        return false;
    });

    return hasErrors;
}

function getTextError(title, words) {
    var SEPARATOR = '\n-----';
    return chalk.cyan(title + ': ' + words.length + SEPARATOR + '\n') + words.join('\n') + chalk.cyan(SEPARATOR);
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
            console.error(chalk.red('[ERR]') +  ' ' + data.resource + time);
            console.error(textErrors.join('\n') + '\n');
        } else {
            program.onlyErrors || console.log(chalk.green('[OK]') + ' ' + data.resource + time);
        }
    }
}

program
    .version(require('../package.json').version)
    .usage('[options] <file-or-directory-or-link...>')
    .option('-f, --format <value>', 'formats: plain or html. Default: plain')
    .option('-l, --lang <value>', 'langs: ru, en, tr. Default: "en,ru"')
    .option('--report', 'generate html report - ./yaspeller.html')
    .option('--dictionary <file>', 'json file for own dictionary')
    .option('--no-colors', 'clean output without colors')
    .option('--only-errors', 'output only errors')
    .option('--debug', 'debug mode')
    .parse(process.argv);
    
if(!program.args.length) {
    program.help();
}

printDebug('get/check ./yaspellerrc');
if(fs.existsSync(jsonAtDirFilename)) {
    try {
        jsonAtDir = JSON.parse(fs.readFileSync(jsonAtDirFilename));
        printDebug('Using ' + jsonAtDirFilename);
    } catch(e) {
        console.error(chalk.red('Error parsing ' + jsonAtDirFilename));
        process.exit(2);
    }
}

Object.keys(jsonAtDir).forEach(function(key) {
    json[key] = jsonAtDir[key];
});

chalk.enabled = program.colors;

mDebug.setDebug(program.debug);

yaspeller.setHtmlExts(json.html);
yaspeller.setFileExtensions(json.fileExtensions);
yaspeller.setExcludeFiles(json.excludeFiles);

settings.lang = program.lang || json.lang;
settings.format = program.format || json.format;

json.dictionary || (dictionary = json.dictionary);

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
    queries = [],
    onResource = function(err, data) {
        err || (hasErrors = true);
        buildResource(err, data);
    };

program.args.forEach(function(resource) {
    queries.push(Q.Promise(function(resolve) {
        if(resource.search(/^https?:/) > -1) {
            if(resource.search(/sitemap\.xml$/) > -1) {
                yaspeller.checkSitemap(resource, function() {
                    resolve();
                }, settings, onResource);
            } else {
                yaspeller.checkUrl(resource, function(err, data) {
                    onResource(err, data);
                    resolve();
                }, settings);
            }
        } else {
            if(fs.existsSync(resource)) {
                if(fs.statSync(resource).isDirectory()) {
                    yaspeller.checkDir(resource, function() {
                        resolve();
                    }, settings, onResource);
                } else {
                    yaspeller.checkFile(resource, function(err, data) {
                        onResource(err, data);
                        resolve();
                    }, settings);
                }
            } else {
                onResource(true, Error(resource + ': is not exists'));
                resolve();
            }
        }
    }));
});

Q.all(queries).then(function() {
    program.onlyErrors || console.log(chalk.magenta('Build finished: ' + ((+new Date() - startTime) / 1000) + ' sec.'));
    process.exit(hasErrors ? 1 : 0);
});
