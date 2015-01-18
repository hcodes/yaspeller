#!/usr/bin/env node

var fs = require('fs'),
    async = require('async'),
    chalk = require('chalk'),
    program = require('commander'),
    programOptions = require('../lib/options'),
    debug = require('../lib/debug'),
    report = require('../lib/report'),
    utils = require('../lib/utils'),
    yaspeller = require('../lib/yaspeller'),
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
Object.keys(jsonConfig).forEach(function(key) {
    json[key] = jsonConfig[key];
});

chalk.enabled = program.colors;
debug.setDebug(program.debug);

var settings = {
    lang: program.lang || json.lang,
    format: program.format || json.format,
    options: json.options || {},
    maxRequests: program.maxRequests || json.maxRequests,
    fileExtensions: program.fileExtensions || json.fileExtensions,
    ignoreComments: program.ignoreComments ? json.ignoreComments : false,
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
    dictionary = utils.getDictionary(program.dictionary);
}

var tasks = [],
    hasErrors = false,
    onResource = function(err, data) {
        if(err || (data && data.data && data.data.length)) {
            hasErrors = true;
        }

        if(data && Array.isArray(data.data)) {
            data.data = utils.delDictWords(data.data, dictionary);
            data.data = utils.delDuplicates(data.data);
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
                if(fs.statSync(resource).isDirectory()) {
                    utils.findFiles(resource, settings.fileExtensions, settings.excludeFiles).forEach(function(file) {
                        subTasks.push(function(subcb) {
                            yaspeller.checkFile(file, function(err, data) {
                                onResource(err, data);
                                subcb();
                            }, settings);
                        });
                    });

                    async.parallelLimit(subTasks, settings.maxRequests || 2, function() {
                        cb();
                    });
                } else {
                    yaspeller.checkFile(resource, function(err, data) {
                        onResource(err, data);
                        cb();
                    }, settings);
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
