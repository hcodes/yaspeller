'use strict';

const async = require('async');
const chalk = require('chalk');
const program = require('commander');
const programOptions = require('./options');
const debug = require('./debug');
const dict = require('./dictionary');
const report = require('./report');
const tasks = require('./tasks');
const utils = require('./utils');
const ignore = require('./ignore');

const isTTY = process.stdin.isTTY;

const jsonDefault = require('../.yaspellerrc.default.json');
const jsonConfig = utils.getConfig(program.config);
const json = Object.assign({}, jsonDefault, jsonConfig);

const settings = {
    excludeFiles: json.excludeFiles,
    options: json.options || {}
};

programOptions.set({ignoreTags: jsonDefault.ignoreTags.join(',')});
program.parse(process.argv);

chalk.enabled = program.colors;
debug.setDebug(program.debug);

[
    'checkYo',
    'fileExtensions',
    'format',
    'ignoreTags',
    'ignoreText',
    'lang',
    'maxRequests'
].forEach(function(key) {
    settings[key] = program[key] || json[key];
});

settings.ignoreText = ignore.prepareRegExpToIgnoreText(settings.ignoreText);

programOptions.apiOptions.forEach(function(el) {
    const key = el[0];
    if (program[key]) {
        settings.options[key] = true;
    } else if (typeof json[key] !== 'undefined') {
        settings.options[key] = json[key];
    }
});

dict.set(program.dictionary, json.dictionary);

report.addReports(program.report || json.report);

if (isTTY && !program.args.length) {
    program.help();
}
async.series(
    isTTY || program.args.length ?
        tasks.forResources(program.args, settings) :
        tasks.forStdin(settings),
    function() {
        report.onend();
        process.exit();
    }
);
