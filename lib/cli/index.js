'use strict';

const async = require('async');
const chalk = require('chalk');
const program = require('commander');

const programOptions = require('../options');
const dict = require('../dictionary');
const reports = require('../reports');
const tasks = require('../tasks');

const { prepareRegExpToIgnoreText } = require('../helpers/ignore');
const { getConfig, defaultConfig } = require('../config');
const { setDebugMode } = require('../helpers/debug');

const { cliActionInit } = require('./actions');

programOptions.init({defaultIgnoreTags: defaultConfig.ignoreTags.join(',')});
program.parse(process.argv);

setDebugMode(program.debug);
if (!program.colors) {
    chalk.level = 0;
}

const jsonConfig = getConfig(program.config);
const json = Object.assign({}, defaultConfig, jsonConfig.data);

const settings = {
    excludeFiles: json.excludeFiles,
    options: json.options || {}
};

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

settings.ignoreText = prepareRegExpToIgnoreText(settings.ignoreText);

programOptions.apiOptions.forEach(function(el) {
    const key = el[0];
    if (program[key]) {
        settings.options[key] = true;
    } else if (typeof json[key] !== 'undefined') {
        settings.options[key] = json[key];
    }
});

dict.set(program.dictionary, json.dictionary);

reports.addReports(program.report || json.report);

if (program.init) {
    cliActionInit();
    process.exit();
}

const isStdin = program.stdin;
if (!isStdin && !program.args.length) {
    program.help();
}

reports.onstart();

async.series(
    isStdin ?
        tasks.forStdin(settings, program.stdinFilename) :
        tasks.forResources(program.args, settings),
    function() {
        reports.onend(jsonConfig.relativePath);
        process.exit();
    }
);
