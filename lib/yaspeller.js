/* jshint maxlen: 300 */
var request = require('request'),
    pth = require('path'),
    fs = require('fs'),
    isutf8 = require('isutf8'),
    Q = require('q'),
    printDebug = require('./print_debug'),
    xml2js = require('xml2js'),
    settings = null,
    isDebug = false,
    fileExtensions;

var FILENAME_SETTINGS = 'yaspeller.json',
    YASPELLER_API_URL = 'http://speller.yandex.net/services/spellservice.json/checkText';

function getExtension(file) {
    var buf = file.split('.');
    return buf[buf.length - 1];
}

function isDir(dir) {
    return fs.statSync(dir).isDirectory();
}

function getFormat(format, ext) {
    if(!format || format === 'auto') {
        var exts = getSettings().fileExtensions;
        if(exts[ext] && exts[ext].format) {
            return exts[ext].format;
        } else {
            return 'plain';
        }
    }

    return format;
}

function getSettings() {
    if(!settings) {
        settings = JSON.parse(fs.readFileSync(FILENAME_SETTINGS));
    }

    return settings;
}

/*function getFileExtensions() {
    if(!fileExtensions) {
        fileExtensions = Object.keys(getSettings().fileExtensions);
    }

    return fileExtensions;
}*/

function getOptions(options) {
    var result = 0,
        standartOptions = {
            IGNORE_UPPERCASE: 1,
            IGNORE_DIGITS: 2,
            IGNORE_URLS: 4,
            FIND_REPEAT_WORDS: 8,
            IGNORE_LATIN: 16,
            NO_SUGGEST: 32,
            FLAG_LATIN: 128,
            BY_WORDS: 256,
            IGNORE_CAPITALIZATION: 512,
            IGNORE_ROMAN_NUMERALS: 2048
        };

    Object.keys(options || {}).forEach(function(key) {
        if(standartOptions[key] && options[key]) {
            result |= standartOptions[key];
        }
    });

    return result;
}

function prepareText(text, format) {
    var buf = text.trim();

    if(format === 'html') {
        buf = buf.replace(/<\/?[^>]+>/g, ' '); // strip html tags
    }

    return buf.replace(/\r\n/g, '\n') // fix Windows
        .replace(/\r/g, '\n') // fix MacOS
        .replace(/\s+\n/g, '\n') // trailling spaces
        .replace(/\s+/g, ' ') // repeat spaces
        .replace(/\n+/g, '\n')
        .trim();
}

function findFiles(dir) {
    var res = [],
        regExp = new RegExp('\\.(' + fileExtensions.join('|') + ')$', 'i'),
        find = function(path) {
            var files = fs.readdirSync(path);
            files.forEach(function(el) {
                var file = pth.join(path, el);
                if(isDir(file)) {
                    find(file);
                } else if(file.search(regExp) !== -1) {
                    res.push(file);
                }
            });
        };

    if(isDir(dir)) {
        find(dir);
    } else {
        res.push(dir);
    }

    return res;
}

/**
 * Check text for typos
 *
 * @param {string} text
 * @param {Function} callback
 * @tutorial settings
 * @param {Object} [settings] Настройки
 * @param {string} [settings.format] Формат текста: plain или html
 * @param {string|Array} [settings.lang] Языки проверки: ru – русский, uk – украинский, en – английский
 * @param {Object} [settings.options] Опции
 * @param {boolean} [settings.options.IGNORE_UPPERCASE] Пропускать слова, написанные заглавными буквами, например, "ВПК"
 * @param {boolean} [settings.options.IGNORE_DIGITS] Пропускать слова с цифрами, например, "авп17х4534"
 * @param {boolean} [settings.options.IGNORE_URLS] Пропускать интернет-адреса, почтовые адреса и имена файлов
 * @param {boolean} [settings.options.FIND_REPEAT_WORDS] Подсвечивать повторы слов, идущие подряд. Например, "я полетел на на Кипр"
 * @param {boolean} [settings.options.IGNORE_LATIN] Пропускать слова, написанные латиницей, например, "madrid"
 * @param {boolean} [settings.options.NO_SUGGEST] Только проверять текст, не выдавая вариантов для замены
 * @param {boolean} [settings.options.FLAG_LATIN] Отмечать слова, написанные латиницей, как ошибочные
 * @param {boolean} [settings.options.BY_WORDS] Не использовать словарное окружение (контекст) при проверке. Опция полезна в случаях, когда на вход сервиса передается список отдельных слов
 * @param {boolean} [settings.options.IGNORE_CAPITALIZATION] Игнорировать неверное употребление ПРОПИСНЫХ/строчных букв, например, в слове "москва"
 * @param {boolean} [settings.options.IGNORE_ROMAN_NUMERALS] Игнорировать римские цифры ("I, II, III, ...")
 */
function checkText(text, callback, settings) {
    settings = settings || {};

    var bufText,
        format = settings.format,
        options = settings.options,
        lang = settings.lang;

    if(Array.isArray(text)) {
        bufText = [];
        text.forEach(function(el) {
            bufText.push(prepareText(el, format));
        });

        bufText = bufText.join('\n');
    } else {
        bufText = prepareText(text, format);
    }

    if(Array.isArray(lang)) {
        lang = lang.join(',');
    }

    request.post(YASPELLER_API_URL, {
        form: {
            format: format || 'plain',
            lang: lang || 'ru,en',
            options: getOptions(options) || 0,
            text: bufText
        }
    }, function(error, response, body) {
        if(!error && response.statusCode === 200) {
            callback(false, JSON.parse(body));
        } else {
            callback(true, Error('API returns status code is ' + response.statusCode));
        }
    });
}

/**
 * Check text in file on typos
 *
 * @param {string} file
 * @param {Function} callback
 * @param {Object} [settings] See {@tutorial options}
 */
function checkFile(file, callback, settings) {
    settings = settings || {};

    if(isDebug) {
        printDebug('get: ' + file);
    }

    if(fs.existsSync(file)) {
        if(fs.statSync(file).isFile()) {
            var buf = fs.readFileSync(file);
            if(isutf8(buf)) {
                settings.format = getFormat(settings.format, getExtension(file, settings.format));

                if(isDebug) {
                    printDebug('post text -> api: ' + file);
                }

                checkText(buf.toString(), function(err, data) {
                    callback(err, !err ? {resource: file, data: data} : data);
                }, settings);
            } else {
                callback(true, Error(file + ': is not utf-8'));
            }
        } else {
            callback(true, Error(file + ': is not file'));
        }
    } else {
        callback(true, Error(file + ': is not exists'));
    }
}

/**
 * Check text on link for typos
 *
 * @param {string} url
 * @param {Function} callback
 * @param {Object} [settings] See {@tutorial settings}
 */
function checkUrl(url, callback, settings) {
    if(isDebug) {
        printDebug('get: ' + url);
    }

   request.get(url, function(error, response, text) {
        if(error || response.statusCode !== 200) {
            callback(true, Error(url + ': returns status code is ' + response.statusCode));
            return;
        }

        checkText(text, function(err, data) {
            callback(err, {resource: url, data: data});
        }, settings);
    });
}

/**
 *  Check text in files in folders on typos
 *
 * @param {string} dir
 * @param {Function} callback
 * @param {Object} [settings] See {@tutorial settings}
 */
function checkDir(dir, callback, settings) {
    if(!fs.existsSync(dir)) {
        callback([[true, Error(dir + ': file or directory is not exists')]]);
        return;
    }

    var files = findFiles(dir),
        queries = [];

    files.forEach(function(file) {
        queries.push(Q.Promise(function(resolve) {
            checkFile(file, function(err, data) {
                resolve([err, data]);
            }, settings);
        }));
    });

    Q.all(queries).done(function(data) {
        callback(data);
    });
}

/**
 * Check text on pages of sitemap.xml
 *
 * @param {string} url
 * @param {Function} callback
 * @param {Object} [settings] See {@tutorial settings}
 */
function checkSitemap(url, callback, settings) {
    var queries = [],
        results = [];

    if(isDebug) {
        printDebug('get: ' + url);
    }

    request.get(url, function(error, response, xml) {
        if(error || response.statusCode !== 200) {
            results.push([true, Error(url + ': returns status code is ' + response.statusCode)]);
            callback(results);

            return;
        }

        var parser = new xml2js.Parser();
        parser.parseString(xml, function(err, result) {
            if(err) {
                results.push([true, Error(url + ': error parsing xml')]);
                callback(results);
                return;
            }

            if(result && result.urlset && Array.isArray(result.urlset.url)) {
                result.urlset.url.forEach(function(el) {
                    el.loc.forEach(function(url) {
                        queries.push(Q.Promise(function(resolve) {
                            checkUrl(url, function(err, data) {
                                resolve([err, data]);
                            }, settings);
                        }));
                    });
                });
            }

            Q.all(queries).done(function(data) {
                callback(data);
            });
        });
    });
}

/**
 * Check text on pages of sitemap.xml
 *
 * @param {string} url
 * @param {Function} callback
 * @param {Object} [settings] See {@tutorial settings}
 */
function checkSitemap(url, callback, settings) {
    var queries = [],
        results = [];

    if(isDebug) {
        printDebug('get: ' + url);
    }

    request.get(url, function(error, response, xml) {
        if(error || response.statusCode !== 200) {
            results.push([true, Error(url + ': returns status code is ' + response.statusCode)]);
            callback(results);

            return;
        }

        var parser = new xml2js.Parser();
        parser.parseString(xml, function(err, result) {
            if(err) {
                results.push([true, result]);
                callback(results);
                return;
            }

            if(result && result.urlset && Array.isArray(result.urlset.url)) {
                result.urlset.url.forEach(function(el) {
                    el.loc.forEach(function(url) {
                        queries.push(Q.Promise(function(resolve) {
                            checkUrl(url, function(err, data) {
                                resolve([err, data]);
                            }, settings);
                        }));
                    });
                });
            }

            Q.all(queries).done(function(data) {
                callback(data);
            });
        });
    });
}

module.exports = {
    setDebug: function(val) {
        isDebug = val;
    },
    setFileExtensions: function(exts) {
        fileExtensions = exts;
    },
    getSettings: getSettings,
    checkText: checkText,
    checkFile: checkFile,
    checkDir: checkDir,
    checkUrl: checkUrl,
    checkSitemap: checkSitemap
};
