/* jshint maxlen: 300 */
var request = require('request'),
    async = require('async'),
    fs = require('fs'),
    isutf8 = require('isutf8'),
    minimatch = require('minimatch'),
    pth = require('path'),
    xml2js = require('xml2js'),
    printDebug = require('../lib/debug').print,
    YASPELLER_API_URL = 'http://speller.yandex.net/services/spellservice.json/checkText',
    params = {
        fileExtensions: [],
        htmlFileExtensions: [],
        maxRequests: 2,
        excludeFiles: []
    };

function getExtension(file) {
    var buf = file.split('.');
    return buf[buf.length - 1];
}

function getFileFormat(file, format) {
    if(format === 'html' || format === 'plain'){
        return format;
    }

    return params.htmlFileExtensions.indexOf(getExtension(file)) > -1 ? 'html' : 'plain';
}

function getUrlFormat(url, format) {
    if(format === 'html' || format === 'plain') {
        return format;
    }

    var ext = getExtension(url);
    if(ext) {
        return params.htmlFileExtensions.indexOf(ext) > -1 ? 'html' : 'plain';
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
        var upperCaseKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
        if(standartOptions[upperCaseKey] && options[key]) {
            result |= standartOptions[upperCaseKey];
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
        regExp = new RegExp('\\.(' + params.fileExtensions.join('|') + ')$', 'i'),
        isDir = function(dir) {
            return fs.statSync(dir).isDirectory();
        },
        find = function(path) {
            var files = fs.readdirSync(path);
            files.forEach(function(el) {
                var file = pth.join(path, el);
                for(var i = 0; i < params.excludeFiles.length; i++) {
                    if(minimatch(file, params.excludeFiles[i])) {
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
 * @param {Object} [settings]
 * @param {string} [settings.format] Text format: plain or html
 * @param {string|Array} [settings.lang] Language: en, kk, ru or uk
 * @param {Object} [settings.options]
 * @param {boolean} [settings.options.ignoreUppercase] Ignore words written in capital letters
 * @param {boolean} [settings.options.ignoreDigits] Ignore words with numbers, such as "avp17h4534"
 * @param {boolean} [settings.options.ignoreUrls] Ignore Internet addresses, email addresses and filenames
 * @param {boolean} [settings.options.findRepeatWords] Highlight repetitions of words, consecutive. For example, "I flew to to to Cyprus"
 * @param {boolean} [settings.options.ignoreLatin] Ignore words, written in Latin, for example, "madrid"
 * @param {boolean} [settings.options.noSuggest] Just check the text, without giving options to replace
 * @param {boolean} [settings.options.flagLatin] Celebrate words, written in Latin, as erroneous
 * @param {boolean} [settings.options.byWords] Do not use a dictionary environment (context) during the scan. This is useful in cases where the service is transmitted to the input of a list of individual words
 * @param {boolean} [settings.options.ignoreCapitalization] Ignore the incorrect use of UPPERCASE / lowercase letters, for example, in the word "moscow"
 * @param {boolean} [settings.options.ignoreRomanNumerals] Ignore Roman numerals ("I, II, III, ...")
 */
function checkText(text, callback, settings) {
    settings = settings || {};

    var format = settings.format || 'plain',
        options = getOptions(settings.options),
        lang = settings.lang || 'en,ru';

    text = prepareText(text, format);

    if(Array.isArray(lang)) {
        lang = lang.join(',');
    }

    var tasks = [],
        texts = splitText(text);
    texts.forEach(function(el) {
        tasks.push(function(cb) {
            request.post(YASPELLER_API_URL, {
                form: {
                    format: format,
                    lang: lang,
                    options: options,
                    text: el
                }
            }, function(error, response, body) {
                if(!error && response && response.statusCode === 200) {
                    cb(false, [false, JSON.parse(body)]);
                } else {
                    cb(false, [true, Error('Yandex.Speller API returns status code is ' + (response && response.statusCode))]);
                }
            });
        });
    });

    printDebug('API requests for text: ' + tasks.length);

    async.parallelLimit(tasks, params.maxRequests, function(err, data) {
        var buf = mergeResults(data);
        callback(buf.err, buf.data);
    });
}

function splitText(text) {
    var MAX_LEN = 10000, // max length of text for Yandex.Speller API
        texts = [],
        pos = 0,
        newPos = 0;

    while(pos < text.length) {
        if(pos + MAX_LEN >= text.length) {
            texts.push(text.substring(pos));
            break;
        } else {
            newPos = getPosition(text, pos + MAX_LEN);
            texts.push(text.substring(pos, newPos));
            pos = newPos;
        }
    }

    return texts;
}

function getPosition(text, start) {
    for(var i = start - 1; i >= start - 500; i--) {
        var sym = text[i];
        if(sym === ' ' || sym === '\n' || sym === '\t') {
            return i;
        }
    }

    return start;
}

function mergeResults(res) {
    var err = false, data = [];

    res.some(function(el) {
        if(el[0]) {
            err = true;
            data = el[1];
            return true;
        }

        return false;
    });

    if(!err) {
        res.forEach(function(el) {
            data = data.concat(el[1]);
        });
    }

    return {
        err: err,
        data: data
    };
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
 * @param {Function} commonCallback Common callback
 * @param {Object} [settings] See {@tutorial settings}
 * @param {Function} [callback] Callback on each file
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
        format = settings.format,
        tasks = [];

    files.forEach(function(file) {
        tasks.push(function(cb) {
            settings.format = getFileFormat(file, format);
            checkFile(file, function(err, data) {
                callback && callback(err, data);
                cb(false, [err, data]);
            }, settings);
        });
    });

    async.parallelLimit(tasks, params.maxRequests, function(err, data) {
        commonCallback(data);
    });
}

/**
 * Check text on pages of sitemap.xml
 *
 * @param {string} url
 * @param {Function} commonCallback Common callback
 * @param {Object} [settings] See {@tutorial settings}
 * @param {Function} [callback] Callback on each url
 */
function checkSitemap(url, commonCallback, settings, callback) {
    settings = settings || {};

    var results = [],
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

            var tasks = [];
            if(result && result.urlset && Array.isArray(result.urlset.url)) {
                result.urlset.url.forEach(function(el) {
                    el.loc && el.loc.forEach(function(url) {
                        tasks.push(function(cb) {
                            settings.format = getUrlFormat(url, format);
                            checkUrl(url, function(err, data) {
                                callback && callback(err, data);
                                cb(false, [err, data]);
                            }, settings);
                        });
                    });
                });
            }

            async.parallelLimit(tasks, params.maxRequests, function(err, data) {
                commonCallback(data);
            });
        });
    });
}

module.exports = {
    setParams: function(p) {
        Object.keys(p).forEach(function(key) {
            params[key] = p[key];
        });
    },
    checkText: checkText,
    checkFile: checkFile,
    checkDir: checkDir,
    checkUrl: checkUrl,
    checkSitemap: checkSitemap
};
