var fs = require('fs'),
    pth = require('path'),
    minimatch = require('minimatch'),
    isutf8 = require('isutf8'),
    chalk = require('chalk'),
    debug = require('../lib/debug'),
    printDebug = debug.print;

function loadConfig(file) {
    var data = null;
    if(fs.existsSync(file)) {
        try {
            data = JSON.parse(fs.readFileSync(file));
            printDebug('Using config: ' + file);
        } catch(e) {
            console.error(chalk.red('Error parsing ' + file));
            process.exit(2);
        }
    }

    return data;
}

function isDir(dir) {
    return fs.statSync(dir).isDirectory();
}

module.exports = {
    getDictionary: function(file) {
        if(fs.existsSync(file)) {
            printDebug('get/check dictionary: ' + file);
            try {
                var bufDict = fs.readFileSync(file);
                if(!isutf8(bufDict)) {
                    console.error(file + ': is not utf-8');
                    process.exit(2);
                }

                printDebug('use dictionary: ' + file.dictionary);

                return JSON.parse(bufDict.toString('utf-8'));
            } catch(e) {
                console.error(file + ': error parsing JSON');
                process.exit(2);
            }
        } else {
            console.error(file + ': is not exists');
            process.exit(2);
        }

        return [];
    },
    getConfig: function(file) {
        var data = null;

        printDebug('get/check JSON config');

        if(file) {
            data = loadConfig(file);
        } else {
            data = loadConfig('./.yaspellerrc');
            if(!data) {
                data = loadConfig('./.yaspeller.json');
            }
        }

        return data || {};
    },
    findFiles: function(dir, fileExtensions, excludeFiles) {
        var res = [],
            find = function(path) {
                var files = fs.readdirSync(path);
                files.forEach(function(el) {
                    var file = pth.resolve(path, el),
                        ext = pth.extname(file);
                    for(var i = 0; i < excludeFiles.length; i++) {
                        if(minimatch(file, pth.resolve('.', excludeFiles[i]), {dot: true})) {
                            return;
                        }
                    }

                    if(isDir(file)) {
                        find(file);
                    } else if(!fileExtensions.length || fileExtensions.indexOf(ext) !== -1) {
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
    },
    delDictWords: function(data, dictionary) {
        var buf = [];
        data.forEach(function(el) {
            if((el.code !== 1 && el.code !== 3) || dictionary.indexOf(el.word) === -1) {
                buf.push(el);
            }
        });

        return buf;
    },
    delDuplicates: function(data) {
        var buf = [],
            obj = {};

        data.forEach(function(el) {
            var code = el.code,
                word = el.word,
                s = el.s;

            if(!word) {
                buf.push(el);
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
                buf.push(obj[code][word]);
            });
        });

        return buf;
    },
    getOkSym: function() {
        return process.platform === 'win32' ? '[OK]' : '✓';
    },
    getErrSym: function() {
        return process.platform === 'win32' ? '[ERR]' : '✗';
    }
};
