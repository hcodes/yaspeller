'use strict';

var async = require('async'),
    chalk = require('chalk'),
    program = require('commander'),
    programOptions = require('./options'),
    debug = require('./debug'),
    dict = require('./dictionary'),
    report = require('./report'),
    tasks = require('./tasks'),
    utils = require('./utils'),
    _ = require('lodash'),
    json,
    jsonConfig,
    jsonDefault = require('../.yaspellerrc.default.json'),
    settings = {};

programOptions.set({ignoreTags: jsonDefault.ignoreTags.join(',')});

program.parse(process.argv);

jsonConfig = utils.getConfig(program.config);

json = _.assign(jsonDefault, jsonConfig);

chalk.enabled = program.colors;
debug.setDebug(program.debug);

var settings = {
    excludeFiles: json.excludeFiles,
    options: json.options || {}
};

['checkYo', 'fileExtensions', 'format', 'ignoreTags', 'lang', 'maxRequests'].forEach(function(key) {
    settings[key] = program[key] || json[key];
});

programOptions.apiOptions.forEach(function(el) {
    var key = el[0];
    if(program[key]) {
        settings.options[key] = true;
    } else if(typeof json[key] !== 'undefined') {
        settings.options[key] = json[key];
    }
});

dict.set(program.dictionary, json.dictionary);

report.addReports(program.report || json.report);

if(process.stdin.isTTY && !program.args.length) {
    program.help();
}

async.series(
    process.stdin.isTTY ?
        tasks.forResources(program.args, settings) :
        tasks.forStdin(settings),
    function() {
        report.onend();
        process.exit();
    }
);
