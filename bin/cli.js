#!/usr/bin/env node

var fs = require('fs'),
    chalk = require('chalk'),
    isutf8 = require('isutf8'),
    Q = require('q'),
    program = require('commander'),
    yaspeller = require('../lib/yaspeller'),
    printDebug = require('../lib/print_debug'),
    FILENAME_DICTIONARY = '.yaspeller.dictionary.json',
    dictionary;

function getDictionary(filename) {
    var dict;

    printDebug('get/check dictionary: ' + filename);
    if(fs.existsSync(filename)) {
        try {
            dict = fs.readFileSync(filename);
            if(!isutf8(dict)) {
                console.error(filename + ': is not utf-8');
                process.exit(1);
            }

            dictionary = JSON.parse(dict.toString('utf-8'));
            printDebug('use dictionary: ' + filename);
        } catch(e) {
            console.error(filename + ': error parsing JSON');
            process.exit(1);
        }
    }

    return dict || [];
}

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

        if(textErrors.length) {
            console.error(chalk.red.bold('[ERR]'), data.resource);
            console.error(textErrors.join('\n') + '\n');
        } else {
            console.log(chalk.bold.green('[OK]'), data.resource);
        }
    }
}

program
    .version(require('../package.json').version)
    .usage('[options] <file-or-directory-or-link...>')
    .option('-l, --lang <s>', 'Langs: ru, en, tr. Default: "en,ru"')
    .option('-d, --debug', 'Debug mode')
    .option('-di, --dictionary <s>', 'json file for own dictionary')
    .option('-f, --format <s>', 'Formats: plain or html. Default: plain')
    .parse(process.argv);

var startTime = Date.now(),
    settings = {};

if(program.lang) {
    settings.lang = program.lang;
}

if(program.format) {
    settings.format = program.format;
}

if(!program.args.length) {
    program.help();
}

var hasErrors = false,
    onNext = function(data) {
        data.forEach(function(el) {
            if(el[0]) {
                hasErrors = true;
            }

            buildResource(el[0], el[1]);
        });
    };

yaspeller.setDebug(program.debug);

dictionary = getDictionary(program.dictionary || FILENAME_DICTIONARY);

var queries = [];
program.args.forEach(function(resource) {
    queries.push(Q.Promise(function(resolve) {
        if(resource.search(/^https?:/) > -1) {
            if(resource.search(/sitemap\.xml$/) > -1) {
                yaspeller.checkSitemap(resource, function(err, data) {
                    onNext(err, data);
                    resolve();
                }, settings);
            } else {
                yaspeller.checkUrl(resource, function(err, data) {
                    onNext([[err, data]]);
                    resolve();
                }, settings);
            }
        } else {
            if(fs.existsSync(resource)) {
                if(fs.statSync(resource).isDirectory()) {
                    yaspeller.checkDir(resource, function(err, data) {
                        onNext(err, data);
                        resolve();
                    }, settings);
                } else {
                    yaspeller.checkFile(resource, function(err, data) {
                        onNext([[err, data]]);
                        resolve();
                    }, settings);
                }
            } else {
                onNext([[true, Error(resource + ': is not exists')]]);
                resolve();
            }
        }
    }));
});

Q.all(queries).then(function() {
    console.log(chalk.magenta('Build finished: ' + ((+new Date() - startTime) / 1000) + ' sec.'));
    process.exit(hasErrors ? 1 : 0);
});
