'use strict';

var async = require('async'),
    fs = require('fs'),
    pth = require('path'),
    dict = require('./dictionary'),
    exitCodes = require('./exit-codes'),
    report = require('./report'),
    utils = require('./utils'),
    yaspeller = require('./yaspeller');

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
    forResources: function(resources, settings) {
        var tasks = [];
        
        resources.forEach(function(resource) {
            tasks.push(function(cb) {
                var subTasks = [];
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
                            var file = pth.resolve(resource);
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
    forStdin: function(settings) {
        return [function(cb) {
            var text = '';

            process.stdin.setEncoding('utf8');

            process.stdin.on('readable', function() {
                var chunk = process.stdin.read();
                if (chunk !== null) {
                    text += chunk;
                }
            });

            process.stdin.on('end', function() {
                var startTime = Date.now();
                yaspeller.checkText(text, function(err, data) {
                    onResource(err, err ? data : {resource: 'stdin', data: data, time: Date.now() - startTime});
                    cb();
                }, settings);
            });
        }];
    }
};
