'use strict';

const async = require('async');
const program = require('commander');

const { cliActionInit } = require('./actions');
const { defaultConfig } = require('../config');
const dictionary = require('../dictionary');
const { setCliOptions, getMergedOptions } = require('./options');
const reports = require('../reports');
const tasks = require('../tasks');

const { setDebugMode } = require('../helpers/debug');

setCliOptions(defaultConfig);
program.parse(process.argv);

setDebugMode(program.debug);

const mergedOptions = getMergedOptions(program.config);

dictionary.loadDictionaries(program.dictionary, mergedOptions.configDictionary);

if (program.init) {
    cliActionInit();
}

const isStdin = program.stdin;
if (!isStdin && !program.args.length) {
    program.help();
}

reports.set(mergedOptions.report);
reports.onStart();

async.series(
    isStdin ?
        tasks.forStdin(program.stdinFilename, mergedOptions) :
        tasks.forResources(program.args, mergedOptions)
).then(() => {
    reports.onComplete(mergedOptions.configRelativePath);
    process.exit();
}).catch(() => {});
