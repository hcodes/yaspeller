/* jshint maxlen: 300 */
var async = require('async'),
    entities = require('entities'),
    fs = require('fs'),
    isutf8 = require('isutf8'),
    request = require('request'),
    pth = require('path'),
    Showdown = require('showdown'),
    xml2js = require('xml2js'),
    _ = require('lodash'),
    markdownConverter = new Showdown.converter(),
    printDebug = require('../lib/debug').print,
    YASPELLER_API_CHECKTEXT = 'https://speller.yandex.net/services/spellservice.json/checkText',
    MAX_LEN_TEXT = 10000; // Max length of text for Yandex.Speller API

function isHTML(text) {
    return text.search(/<[a-z!]/i) !== -1;
}

function isMarkdown(text) {
    return [
            /^===/m,
            /^\s{0,5}```/m,
            /-- ?:?\|/,
            /\)\[(https?|mailto):/
        ].some(function(el) {
            return text.search(el) !== -1;
        });
}

function getFormat(text, settings) {
    var format = settings.format,
        extname = (settings.extname || '').toLowerCase(),
        extnames = {
            '.htm': 'html',
            '.html': 'html',
            '.xhtml': 'html',
            '.xml': 'html',
            '.svg': 'html',
            '.markdown': 'markdown',
            '.md': 'markdown'
        };
        
    if(['html', 'markdown', 'plain'].indexOf(format) !== -1) {
        return format;
    }

    if(format === 'auto' || !format) {
        if(extnames[extname]) {
            return extnames[extname];
        }
        
        if(isMarkdown(text)) {
            return 'markdown';
        } else if(isHTML(text)) {
            return 'html';
        }
    }

    return 'plain';
}

function getApiFormat(format) {
    return format === 'html' || format === 'markdown' ? 'html' : 'plain';
}

function getOptions(options) {
    var result = 0,
        standartOptions = {
            IGNORE_UPPERCASE: 1,
            IGNORE_DIGITS: 2,
            IGNORE_URLS: 4,
            FIND_REPEAT_WORDS: 8,
            IGNORE_LATIN: 16,
            //NO_SUGGEST: 32,
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
    return text.replace(/\r\n/g, '\n') // Fix Windows
        .replace(/\r/g, '\n') // Fix MacOS
        .replace(/\s+\n/g, '\n') // Trailling spaces
        .replace(/\s+/g, ' ') // Repeat spaces
        .replace(/\n+/g, '\n') // Repeat line ends
        .trim();
}

function ignoreComments(text) {
    var comments = [
        ['<!--', '-->'],
        ['<!ENTITY', '>'],
        ['<!DOCTYPE', '>'],
        ['<\\?xml', '\\?>'],
        ['<!\\[CDATA\\[', '\\]\\]>']
    ];

    comments.forEach(function(tag) {
        var re = new RegExp(tag[0] + '[^]*?' + tag[1], 'gi');
        text = text.replace(re, ' ');
    });

    return text;
}

function ignoreTags(text, tags) {
    var bufTags = [];
    tags.forEach(function(tag) {
        bufTags.push(['<' + tag + '(\\s[^>]*?)?>', '</' + tag + '>']);
    }, this);

    bufTags.forEach(function(tag) {
        var re = new RegExp(tag[0] + '[^]*?' + tag[1], 'gi');
        text = text.replace(re, ' ');
    });

    return text;
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
 * @param {string|Array} [settings.lang] Language: en, kk, ru or uk.
 * @param {Object} [settings.options]
 * @param {boolean} [settings.options.ignoreUppercase] Ignore words written in capital letters.
 * @param {boolean} [settings.options.ignoreDigits] Ignore words with numbers, such as "avp17h4534".
 * @param {boolean} [settings.options.ignoreUrls] Ignore Internet addresses, email addresses and filenames.
 * @param {boolean} [settings.options.findRepeatWords] Highlight repetitions of words, consecutive. For example, "I flew to to to Cyprus".
 * @param {boolean} [settings.options.ignoreLatin] Ignore words, written in Latin, for example, "madrid".
 * @param {boolean} [settings.options.noSuggest] Just check the text, without giving options to replace.
 * @param {boolean} [settings.options.flagLatin] Celebrate words, written in Latin, as erroneous.
 * @param {boolean} [settings.options.byWords] Do not use a dictionary environment (context) during the scan. This is useful in cases where the service is transmitted to the input of a list of individual words.
 * @param {boolean} [settings.options.ignoreCapitalization] Ignore the incorrect use of UPPERCASE / lowercase letters, for example, in the word "moscow".
 * @param {boolean} [settings.options.ignoreRomanNumerals] Ignore Roman numerals ("I, II, III, ...").
 */
function checkText(text, callback, settings) {
    settings = settings || {};

    var format = getFormat(text, settings),
        options = getOptions(settings.options),
        lang = settings.lang || 'en,ru';

    if(format === 'html' || format === 'markdown') {
        if(format === 'markdown') {
            text = markdownConverter.makeHtml(text);
        }

        if(settings.ignoreTags) {
            text = ignoreTags(text, settings.ignoreTags);
        }

        text = ignoreComments(text);
        text = stripTags(text);
        text = entities.decodeHTML(text);
    }

    text = prepareText(text, format);

    if(Array.isArray(lang)) {
        lang = lang.join(',');
    }

    var tasks = [],
        texts = splitText(text),
        apiFormat = getApiFormat(format);

    texts.forEach(function(el, i) {
        printDebug({
            request: i,
            format: format,
            apiFormat: apiFormat,
            lang: lang,
            options: options,
            text: _.trunc(el, 128)
        });

        tasks.push(function(cb) {
            request.post(YASPELLER_API_CHECKTEXT, {
                form: {
                    format: apiFormat,
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

    async.parallelLimit(tasks, getMaxRequest(settings), function(err, data) {
        var buf = mergeResults(data);
        callback(buf.err, buf.data);
    });
}

function splitText(text) {
    var texts = [],
        pos = 0,
        newPos = 0;

    while(pos < text.length) {
        if(pos + MAX_LEN_TEXT >= text.length) {
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
    for(var i = start - 1; i >= start - depth; i--) {
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

    if(fs.existsSync(file)) {
        if(fs.statSync(file).isFile()) {
            var buf = fs.readFileSync(file);
            if(isutf8(buf)) {
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

        if(!word) {
            result.push(el);
            return;
        }

        obj[code] = obj[code] || {};

        if(!obj[code][word]) {
            obj[code][word] = {
                code: code,
                word: word,
                count: 0
            };

            if(Array.isArray(s) && s.length) {
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

module.exports = {
    checkFile: checkFile,
    checkSitemap: checkSitemap,
    checkText: checkText,
    checkUrl: checkUrl,
    removeDuplicates: removeDuplicates,
    errors: [
        {
            code: 1, // ERROR_UNKNOWN_WORD
            title: 'Typos'
        }, {
            code: 2, // ERROR_REPEAT_WORD
            title: 'Repeat words'
        }, {
            code: 3, // ERROR_CAPITALIZATION
            title: 'Capitalization'
        }
    ]
};
