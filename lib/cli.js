'use strict';

const async = require('async');
const chalk = require('chalk');
const fs = require('fs');
const program = require('commander');
const programOptions = require('./options');
const config = require('./config');
const debug = require('./debug');
const dict = require('./dictionary');
const report = require('./report');
const tasks = require('./tasks');
const ignore = require('./ignore');

const jsonDefault = require('../.yaspellerrc.default.json');

programOptions.init({defaultIgnoreTags: jsonDefault.ignoreTags.join(',')});
program.parse(process.argv);

const isStdin = program.stdin;
const jsonConfig = config.get(program.config);
const json = Object.assign({}, jsonDefault, jsonConfig);

const settings = {
    excludeFiles: json.excludeFiles,
    options: json.options || {}
};

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

if (program.init) {
    const yrc = '.yaspellerrc';
    if (fs.existsSync(yrc)) {
        console.log(`File ${yrc} has already been created.`);
    } else {
        fs.writeFileSync(yrc, JSON.stringify(jsonDefault, null,  2));
        console.log(`Successfully created ${yrc} file in ${process.cwd()}`);
    }
    process.exit();
}

if (!isStdin && !program.args.length) {
    program.help();
}

async.series(
    isStdin ?
        tasks.forStdin(settings, program.stdinFilename) :
        tasks.forResources(program.args, settings),
    function() {
        report.onend();
        process.exit();
    }
);
