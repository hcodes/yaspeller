/* jshint maxlen: 300 */
var request = require('request'),
    pth = require('path'),
    fs = require('fs'),
    isutf8 = require('isutf8'),
    Q = require('q'),
    xml2js = require('xml2js'),
    minimatch = require('minimatch'),
    printDebug = require('../lib/debug').print,
    YASPELLER_API_URL = 'http://speller.yandex.net/services/spellservice.json/checkText',
    fileExtensions = [],
    htmlExts = [],
    excludeFiles = [];

function getExtension(file) {
    var buf = file.split('.');
    return buf[buf.length - 1];
}

function getFileFormat(file, format) {
    if(format === 'html' || format === 'plain'){
        return format;
    }

    return htmlExts.indexOf(getExtension(file)) > -1 ? 'html' : 'plain';
}

function getUrlFormat(url, format) {
    if(format === 'html' || format === 'plain') {
        return format;
    }
    
    var ext = getExtension(url);
    if(ext) {
        return htmlExts.indexOf(ext) > -1 ? 'html' : 'plain';
    }

    return 'html';
}

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
        isDir = function(dir) {
            return fs.statSync(dir).isDirectory();
        },
        find = function(path) {
            var files = fs.readdirSync(path);
            files.forEach(function(el) {
                var file = pth.join(path, el);
                for(var i = 0; i < excludeFiles.length; i++) {
                    if(minimatch(file, excludeFiles[i])) {
                        return;
                    }
                }

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

    var format = settings.format,
        options = settings.options,
        lang = settings.lang;

    text = prepareText(text, format);

    if(Array.isArray(lang)) {
        lang = lang.join(',');
    }

    request.post(YASPELLER_API_URL, {
        form: {
            format: format || 'plain',
            lang: lang || 'ru,en',
            options: getOptions(options) || 0,
            text: text
        }
    }, function(error, response, body) {
        if(!error && response.statusCode === 200) {
            callback(false, JSON.parse(body));
        } else {
            callback(true, Error('Yandex.Speller API returns status code is ' + response.statusCode));
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

    printDebug('get: ' + file);

    if(fs.existsSync(file)) {
        if(fs.statSync(file).isFile()) {
            var buf = fs.readFileSync(file);
            if(isutf8(buf)) {
                settings.format = getFileFormat(file, settings.format);

                printDebug('post text -> Yandex.Speller API: ' + file);

                var startTime = Date.now();
                checkText(buf.toString(), function(err, data) {
                    callback(err, err ? data : {resource: file, data: data, time: Date.now() - startTime});
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
    settings = settings || {};

    printDebug('get: ' + url);

    settings.format = getUrlFormat(url, settings.format);

    request.get(url, function(error, response, text) {
        if(error || response.statusCode !== 200) {
            callback(true, Error(url + ': returns status code is ' + response.statusCode));
            return;
        }

        var startTime = Date.now();
        checkText(text, function(err, data) {
            callback(err, err ? data : {resource: url, data: data, time: Date.now() - startTime});
        }, settings);
    });
}

/**
 *  Check text in files in folders on typos
 *
 * @param {string} dir
 * @param {Function} commonCallback
 * @param {Object} [settings] See {@tutorial settings}
 * @param {Function} [callback]
 */
function checkDir(dir, commonCallback, settings, callback) {
    settings = settings || {};

    if(!fs.existsSync(dir)) {
        var obj = [true, Error(dir + ': file or directory is not exists')];
        callback && callback.apply(this, obj);
        commonCallback([obj]);
        return;
    }

    var files = findFiles(dir),
        queries = [],
        format = settings.format;

    files.forEach(function(file) {
        queries.push(Q.Promise(function(resolve) {
            settings.format = getFileFormat(file, format);
            checkFile(file, function(err, data) {
                callback && callback(err, data);
                resolve([err, data]);
            }, settings);
        }));
    });

    Q.all(queries).done(function(data) {
        commonCallback(data);
    });
}

/**
 * Check text on pages of sitemap.xml
 *
 * @param {string} url
 * @param {Function} commonCallback
 * @param {Object} [settings] See {@tutorial settings}
 * @param {Function} [callback]
 */
function checkSitemap(url, commonCallback, settings, callback) {
    settings = settings || {};

    var queries = [],
        results = [],
        format = settings.format;

    printDebug('get: ' + url);

    request.get(url, function(error, response, xml) {
        if(error || response.statusCode !== 200) {
            var obj = [true, Error(url + ': returns status code is ' + response.statusCode)];
            results.push(obj);
            callback && callback.apply(this, obj);
            commonCallback(results);

            return;
        }

        var parser = new xml2js.Parser();
        parser.parseString(xml, function(err, result) {
            if(err) {
                var obj = [true, Error(url + ': error parsing xml')];
                results.push(obj);
                callback && callback.apply(this, obj);
                commonCallback(results);
                return;
            }

            if(result && result.urlset && Array.isArray(result.urlset.url)) {
                result.urlset.url.forEach(function(el) {
                    el.loc.forEach(function(url) {
                        queries.push(Q.Promise(function(resolve) {
                            settings.format = getUrlFormat(url, format);
                            checkUrl(url, function(err, data) {
                                callback && callback(err, data);
                                resolve([err, data]);
                            }, settings);
                        }));
                    });
                });
            }

            Q.all(queries).done(function(data) {
                commonCallback(data);
            });
        });
    });
}

module.exports = {
    setExcludeFiles: function(files) {
        excludeFiles = files;
    },
    setFileExtensions: function(exts) {
        fileExtensions = exts;
    },
    setHtmlExts: function(exts) {
        htmlExts = exts;
    },
    checkText: checkText,
    checkFile: checkFile,
    checkDir: checkDir,
    checkUrl: checkUrl,
    checkSitemap: checkSitemap
};
