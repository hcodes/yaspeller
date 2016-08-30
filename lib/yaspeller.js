'use strict';

const async = require('async');
const entities = require('entities');
const eyo = require('eyo-kernel');
const fs = require('fs');
const formatModule = require('./format');
const ignore = require('./ignore');
const isutf8 = require('isutf8');
const request = require('request');
const pth = require('path');
const showdown = require('showdown');
const xml2js = require('xml2js');
const yaspellerApi = require('yandex-speller');
const markdownConverter = new showdown.Converter();
const printDebug = require('../lib/debug').print;
const MAX_LEN_TEXT = 10000; // Max length of text for Yandex.Speller API

function prepareText(text) {
    return text.replace(/\r\n/g, '\n') // Fix Windows
        .replace(/\r/g, '\n') // Fix MacOS
        .replace(/\s+\n/g, '\n') // Trailling spaces
        .replace(/\s+/g, ' ') // Repeat spaces
        .replace(/\n+/g, '\n') // Repeat line ends
        .trim();
}

function getMaxRequest(settings) {
    return settings.maxRequest || 2;
}

function stripTags(html) {
    return html.replace(/<\/?[a-z][^>]*>/gi, ' ');
}

/**
 * Check text for typos.
 *
 * @param {string} text
 * @param {Function} callback
 * @tutorial settings
 * @param {Object} [settings]
 * @param {string} [settings.format] Text format: plain or html.
 * @param {string|Array} [settings.lang] Language: en, ru or uk.
 * @param {Array<RegExp>} [settings.ignoreText]
 * @param {Object} [settings.options]
 */
function checkText(text, callback, settings) {
    var apiSettings = Object.assign({}, settings),
        format = formatModule.getFormat(text, apiSettings),
        lang = apiSettings.lang || 'en,ru';

    apiSettings.lang = Array.isArray(lang) ? lang.join(',') : lang;

    Array.isArray(apiSettings.ignoreText) && apiSettings.ignoreText.forEach(function(re) {
        text = text.replace(re, '');
    });

    if (ignore.hasIgnoredText(text)) {
        text = ignore.lines(text);
        text = ignore.blocks(text);
    }

    if (format === 'html' || format === 'markdown') {
        if (format === 'markdown') {
            text = markdownConverter.makeHtml(text);
        }

        if (apiSettings.ignoreTags) {
            text = ignore.tags(text, apiSettings.ignoreTags);
        }

        text = ignore.comments(text);
        text = stripTags(text);
        text = entities.decodeHTML(text);
    }

    text = prepareText(text, format);

    var tasks = [],
        texts = splitText(text);

    apiSettings.format = formatModule.getApiFormat(format);

    texts.forEach(function(el, i) {
        printDebug({
            request: i,
            format: format,
            apiFormat: apiSettings.format,
            lang: apiSettings.lang,
            options: apiSettings.options,
            text: el.substring(0, 128)
        });

        tasks.push(function(cb) {
            yaspellerApi.checkText(el, function(error, body) {
                if (error) {
                    cb(false, [true, error]);
                } else {
                    cb(false, [false, body]);
                }
            }, apiSettings);
        });
    });

    async.parallelLimit(tasks, getMaxRequest(apiSettings), function(err, data) {
        var buf = mergeResults(data);

        if (apiSettings.checkYo) {
            checkYo(text, buf.data);
        }

        callback(buf.err, buf.data);
    });
}

function checkYo(text, data) {
    eyo.lint(text, true).safe.forEach(function(el) {
        data.push({
            code: 100,
            word: el.before,
            s: [el.after],
            count: el.count
        });
    });
}

function splitText(text) {
    var texts = [],
        pos = 0,
        newPos = 0;

    while (pos < text.length) {
        if (pos + MAX_LEN_TEXT >= text.length) {
            texts.push(text.substring(pos));
            break;
        } else {
            newPos = getPosition(text, pos + MAX_LEN_TEXT);
            texts.push(text.substring(pos, newPos));
            pos = newPos;
        }
    }

    return texts;
}

function getPosition(text, start) {
    var depth = 500; // MAX_LEN_TEXT / 20
    for (var i = start - 1; i >= start - depth; i--) {
        var sym = text[i];
        if (sym === ' ' || sym === '\n' || sym === '\t') {
            return i;
        }
    }

    return start;
}

function mergeResults(res) {
    var err = false, data = [];

    res.some(function(el) {
        if (el[0]) {
            err = true;
            data = el[1];
            return true;
        }

        return false;
    });

    if (!err) {
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
 * Check text in file on typos.
 *
 * @param {string} file
 * @param {Function} callback
 * @param {Object} [settings] See {@tutorial options}
 */
function checkFile(file, callback, settings) {
    settings = settings || {};
    settings.extname = pth.extname(file);

    printDebug('get: ' + file);

    if (fs.existsSync(file)) {
        if (fs.statSync(file).isFile()) {
            var buf = fs.readFileSync(file);
            if (isutf8(buf)) {
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
 * Check text on link for typos.
 *
 * @param {string} url
 * @param {Function} callback
 * @param {Object} [settings] See {@tutorial settings}
 */
function checkUrl(url, callback, settings) {
    settings = settings || {};
    settings.extname = pth.extname(url);

    printDebug('get: ' + url);

    request.get({
            method: 'GET',
            uri: url,
            gzip: true
        },
        function(error, response, text) {
            if (error) {
                callback(true, error);
                return;
            }

            if (response.statusCode !== 200) {
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
 * Check text on pages of sitemap.xml.
 *
 * @param {string} url
 * @param {Function} commonCallback - Common callback
 * @param {Object} [settings] See {@tutorial settings}
 * @param {Function} [callback] callback - Callback on each url.
 */
function checkSitemap(url, commonCallback, settings, callback) {
    settings = settings || {};

    var results = [];

    printDebug('get: ' + url);

    request.get(url, function(error, response, xml) {
        var obj;

        if (error) {
            obj = [true, error];
            results.push(obj);
            callback && callback.apply(this, obj);
            commonCallback(results);

            return;
        }

        if (response.statusCode !== 200) {
            obj = [true, Error(url + ': returns status code is ' + response.statusCode)];
            results.push(obj);
            callback && callback.apply(this, obj);
            commonCallback(results);

            return;
        }

        var parser = new xml2js.Parser();
        parser.parseString(xml, function(err, result) {
            if (err) {
                var obj = [true, Error(url + ': error parsing xml')];
                results.push(obj);
                callback && callback.apply(this, obj);
                commonCallback(results);
                return;
            }

            var tasks = [];
            if (result && result.urlset && Array.isArray(result.urlset.url)) {
                result.urlset.url.forEach(function(el) {
                    el.loc && el.loc.forEach(function(url) {
                        tasks.push(function(cb) {
                            checkUrl(url, function(err, data) {
                                callback && callback(err, data);
                                cb(false, [err, data]);
                            }, settings);
                        });
                    });
                });
            }

            async.parallelLimit(tasks, getMaxRequest(settings), function(err, data) {
                commonCallback(data);
            });
        });
    });
}

/**
 * Remove duplicates in typos.
 *
 * @param {Object[]} data - Array of typos.
 * @return {Object[]}
 */
function removeDuplicates(data) {
    var result = [],
        obj = {};

    data.forEach(function(el) {
        var code = el.code,
            word = el.word,
            s = el.s;

        if (!word) {
            result.push(el);
            return;
        }

        obj[code] = obj[code] || {};

        if (!obj[code][word]) {
            obj[code][word] = {
                code: code,
                word: word,
                count: el.count || 0
            };

            if (Array.isArray(s) && s.length) {
                obj[code][word].suggest = s;
            }
        }

        obj[code][word].count++;
    });

    Object.keys(obj).forEach(function(code) {
        Object.keys(obj[code]).sort(function(a, b) {
            return a > b ? 1 : -1;
        }).forEach(function(word) {
            result.push(obj[code][word]);
        });
    });

    return result;
}

function getErrors() {
    return yaspellerApi.errorCodes.filter(function(el) {
        return el.code !== 4;
    }).map(function(el) {
        return {
            code: el.code,
            title: el.text
        };
    }).concat({
        code: 100, // ERROR_EYO
        title: 'Letter Ё (Yo)'
    });
}

module.exports = {
    checkFile,
    checkSitemap,
    checkText,
    checkUrl,
    removeDuplicates,
    errors: getErrors()
};
