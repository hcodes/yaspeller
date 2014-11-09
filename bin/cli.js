#!/usr/bin/env node

var fs = require('fs'),
    pth = require('path'),
    request = require('request'),
    yaspeller = require('../lib/yaspeller'),
    program = require('commander'),
    xml2js = require('xml2js'),
    FILENAME_DICTIONARY = '.yaspeller.dictionary.json',
    FILE_EXTENSIONS = ['wiki', 'md', 'txt', 'text', 'html', 'htm', 'json', 'js', 'css', 'xml', 'svg'],
    isDir = function(path) {
        return fs.statSync(path).isDirectory();
    },
    dictionary = [];

if(fs.existsSync(FILENAME_DICTIONARY)) {
    dictionary = JSON.parse(fs.readFileSync(FILENAME_DICTIONARY, 'utf-8'));
}

function printErrors(resource, words) {
    var bufWords = delDuplicates(words);

    bufWords = markRuEnSymbols(bufWords);

    if(bufWords.length) {
        console.log('Resource: ' + resource);
        console.log('typos: ' + bufWords.join(', ') + '\n');
    }
}

function firstUpperCase(word) {
    return word.substr(0, 1).toUpperCase() + word.substr(1);
}

function delDuplicates(ar) {
    var props = {},
        result = [];

    ar.forEach(function(el) {
        if(props[el]) {
            props[el]++;
        } else {
            props[el] = 1;
        }
    });

    Object.keys(props).forEach(function(key) {
        if(props[key] > 1) {
            result.push(key + ' (' + props[key] + ')');
        } else {
            result.push(key);
        }
    });

    return result.sort();
}

function markRuEnSymbols(words) {
    var result = [];
    words.forEach(function(el) {
        if(el.search(/[a-z]/i) !== -1 && el.search(/[а-яё]/i) !== -1) {
            result.push(el + ' (en: ' + el.replace(/[а-яё]/gi, '*') + ', ru: ' + el.replace(/[a-z]/gi, '*') + ')');
        } else {
            result.push(el);
        }
    });

    return result;
}

function getWords(data) {
    var res = [];
    data.forEach(function(el) {
        var word = firstUpperCase(el.word);
        var find = false;
        dictionary.forEach(function(el2) {
            var dword = firstUpperCase(el2);
            if(dword === word) {
                find = true;
            }
        });

        if(!find) {
            res.push(el.word);
        }
    });

    return res;
}

function checkText(text, resource, options) {
    // Если в тексте нет русских символов, то проверять не нужно
    if(!text || (options.lang === 'ru' && text.search(/[а-яё]/i) === -1)) {
        return;
    }

    yaspeller.checkText(text, options.lang, options.options, options.format, function(error, data) {
        var words = getWords(data);
        printErrors(resource, words);
    });
}

function checkFile(file, options) {
    var text = fs.readFileSync(file, 'utf-8');
    checkText(text, file, options);
}

function checkUrl(url, options) {
    request.get(url, function(error, response, text) {
        checkText(text, url, options);
    });
}

function checkDir(dir, options) {
    var files = findFiles(Array.isArray(dir) ? dir : [dir]);
    files.forEach(function(file) {
        checkFile(file, options);
    });
}

function findFiles(files) {
    var res = [],
    regExp = new RegExp('\.(' + FILE_EXTENSIONS.join('|') + ')$', 'i'),
    find = function (path) {
        var files = fs.readdirSync(path);
        files.forEach(function (el) {
            var file = pth.join(path, el);
            if (isDir(file)) {
                find(file);
            } else if (file.search(regExp) !== -1) {
                res.push(file);
            }
        });
    };

    files.forEach(function (el) {
        if(isDir(el)) {
            find(el);
        } else {
            res.push(el);
        }
    });

    return res;
}

function checkSitemap(url, options) {
    request.get(url, function(error, response, xml) {
        var parser = new xml2js.Parser();
        parser.parseString(xml, function (err, result) {
            result.urlset.url.forEach(function(el) {
                el.loc.forEach(function(url) {
                    checkUrl(url, options);
                });
            });
        });
    });
}

program
    .version(JSON.parse(fs.readFileSync(__dirname + '/../package.json')).version)
    .usage('[options] <file-or-directory-or-link>')
    .option('-d, --debug', 'debugging mode')
    .parse(process.argv);

var resource = process.argv[2],
    timeA = Date.now(),
    opt = {format: 'html', lang: 'ru'};

if(!resource) {
    program.help();
}

if(resource.search(/^https?:/) !== -1) {
    if(resource.search(/sitemap\.xml$/) !== -1) {
        checkSitemap(resource, opt);
    } else {
        checkUrl(resource, opt);
    }
} else {
    if(fs.existsSync(resource)) {
        if(isDir(resource)) {
            checkDir(resource, opt);
        } else {
            checkFile(resource, opt);
        }
    } else {
        console.log(resource + ': No such file or directory');
    }
}
