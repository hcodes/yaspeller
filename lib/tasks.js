'use strict';

const async = require('async');
const fs = require('fs');
const pth = require('path');
const dict = require('./dictionary');
const exitCodes = require('./exit-codes');
const report = require('./report');
const utils = require('./utils');
const yaspeller = require('./yaspeller');

function hasData(err, data) {
    return !err && data && Array.isArray(data.data) && data.data.length;
}

function onResource(err, data) {
    if (hasData(err, data)) {
        data.data = dict.removeDictWords(data.data);
        data.data = yaspeller.removeDuplicates(data.data);
    }

    if (!process.exitCode && hasData(err, data)) {
        process.exitCode = exitCodes.HAS_TYPOS;
    }

    if (err) {
        process.exitCode = exitCodes.ERROR_LOADING;
    }

    report.oneach(err, data);
}

module.exports = {
    /**
     * Prepare tasks for resources.
     *
     * @param {Array} resources
     * @param {Object} settings
     * @return {Array}
     */
    forResources(resources, settings) {
        const tasks = [];

        resources.forEach(function(resource) {
            tasks.push(function(cb) {
                const subTasks = [];
                if (utils.isUrl(resource)) {
                    if (utils.isSitemap(resource)) {
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
                    if (fs.existsSync(resource)) {
                        if (utils.isDir(resource)) {
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
                            const file = pth.resolve(resource);
                            if (utils.isExcludedFile(file, settings.excludeFiles)) {
                                cb();
                            } else {
                                yaspeller.checkFile(file, function(err, data) {
                                    onResource(err, data);
                                    cb();
                                }, settings);
                            }
                        }
                    } else {
                        onResource(true, Error(resource + ': is not exists'));
                        cb();
                    }
                }
            });
        });

        return tasks;
    },
    /**
     * Prepare task for stdin.
     *
     * @param {Object} settings
     * @return {Array}
     */
    forStdin(settings) {
        return [function(cb) {
            let text = '';

            process.stdin.setEncoding('utf8');

            process.stdin.on('readable', function() {
                const chunk = process.stdin.read();
                if (chunk !== null) {
                    text += chunk;
                }
            });

            process.stdin.on('end', function() {
                const startTime = Date.now();
                yaspeller.checkText(text, function(err, data) {
                    onResource(err, err ? data : {resource: 'stdin', data: data, time: Date.now() - startTime});
                    cb();
                }, settings);
            });
        }];
    }
};
