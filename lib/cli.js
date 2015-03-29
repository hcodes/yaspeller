'use strict';

var fs = require('fs'),
    async = require('async'),
    chalk = require('chalk'),
    program = require('commander'),
    pth = require('path'),
    programOptions = require('./options'),
    debug = require('./debug'),
    dict = require('./dictionary'),
    report = require('./report'),
    utils = require('./utils'),
    yaspeller = require('./yaspeller'),
    _ = require('lodash'),
    json,
    jsonConfig = {},
    jsonDefault = require('../.yaspellerrc.default.json'),
    dictionary = [],
    settings = {};

programOptions.set({
    ignoreTags: jsonDefault.ignoreTags.join(',')
});

program.parse(process.argv);

if(!program.args.length) {
    program.help();
}

jsonConfig = utils.getConfig(program.config);
json = jsonDefault;
_.forOwn(jsonConfig, function(value, key) {
    json[key] = value;
});

chalk.enabled = program.colors;
debug.setDebug(program.debug);

var settings = {
    lang: program.lang || json.lang,
    format: program.format || json.format,
    options: json.options || {},
    maxRequests: program.maxRequests || json.maxRequests,
    fileExtensions: program.fileExtensions || json.fileExtensions,
    ignoreTags: program.ignoreTags || json.ignoreTags,
    excludeFiles: json.excludeFiles
};

programOptions.apiOptions.forEach(function(el) {
    var key = el[0];
    if(program[key]) {
        settings.options[key] = true;
    } else if(typeof json[key] !== 'undefined') {
        settings.options[key] = json[key];
    }
});

if(json.dictionary) {
    dictionary = json.dictionary;
}

if(program.dictionary) {
    dictionary = dict.getDictionary(program.dictionary);
}

var tasks = [],
    hasErrors = false,
    hasData = function(err, data) {
        return !err && data && Array.isArray(data.data) && data.data.length;
    },
    onResource = function(err, data) {
        if(hasData(err, data)) {
            data.data = dict.removeDictWords(data.data, dictionary);
            data.data = yaspeller.removeDuplicates(data.data);
        }

        if(err || hasData(err, data)) {
            hasErrors = true;
        }

        report.oneach(err, data);
    };

report.addReports(program.report || json.report);

program.args.forEach(function(resource) {
    tasks.push(function(cb) {
        var subTasks = [];
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
                if(utils.isDir(resource)) {
                    utils
                        .findFiles(resource, settings.fileExtensions, settings.excludeFiles)
                        .forEach(function(file) {
                            subTasks.push(function(subcb) {
                                yaspeller.checkFile(file, function(err, data) {
                                    onResource(err, data);
                                    subcb();
                                }, settings);
                            });
                        });

                    async.parallelLimit(subTasks, settings.maxRequests, function() {
                        cb();
                    });
                } else {
                    var file = pth.resolve(resource);
                    if(utils.isReqFile(file, settings)) {
                        yaspeller.checkFile(file, function(err, data) {
                            onResource(err, data);
                            cb();
                        }, settings);
                    } else {
                        cb();
                    }
                }
            } else {
                onResource(true, Error(resource + ': is not exists'));
                cb();
            }
        }
    });
});

async.series(tasks, function() {
    report.onend();
    process.exit(hasErrors ? 1 : 0);
});
