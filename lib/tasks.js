'use strict';

const async = require('async');
const fs = require('fs');
const pth = require('path');
const glob = require('glob');

const dictionary = require('./dictionary');
const exitCodes = require('./exit-codes');
const reports = require('./reports');
const yaspeller = require('./yaspeller');
const { findFiles, isDirectory, isExcludedFile } = require('./helpers/file');
const { isUrl, isSitemap } = require('./helpers/url');

function hasData(err, data) {
    return !err && data && Array.isArray(data.data) && data.data.length;
}

function onResource(err, data, originalText) {
    if (hasData(err, data)) {
        data.data = dictionary.removeDictionaryWordsFromData(data.data);
        data.data = yaspeller.removeDuplicates(data.data);

        yaspeller.addPositions(originalText, data.data);
        yaspeller.sortByPositions(data.data);

    }

    if (!process.exitCode && hasData(err, data)) {
        process.exitCode = exitCodes.HAS_TYPOS;
    }

    if (err) {
        process.exitCode = exitCodes.ERROR_LOADING;
    }

    reports.onResourceComplete(err, data);
}

module.exports = {
    /**
     * Expand glob arguments.
     *
     * @param {string[]} args
     * @returns {string[]}
     */
    expandGlobArgs(args) {
        let result = [];

        for (const value of args) {
            if (isUrl(value)) {
                result.push(value);
            } else {
                const files = glob.sync(value);
                if (files) {
                    result = result.concat(files);
                }
            }
        }

        return result;
    },
    /**
     * Prepare tasks for resources.
     *
     * @param {Array} resources
     * @param {Object} settings
     * @returns {Array}
     */
    forResources(resources, settings) {
        return this.expandGlobArgs(resources).map(resource => callback => {
            if (isUrl(resource)) {
                this.forUrl(resource, settings, callback);
            } else {
                if (fs.existsSync(resource)) {
                    this.forFiles(resource, settings, callback);
                } else {
                    onResource(true, Error(`${resource}: is not exists`));
                    callback();
                }
            }
        });
    },
    /**
     * Prepare task for stdin.
     *
     * @param {string} filename
     * @param {Object} settings
     * @returns {Array}
     */
    forStdin(filename, settings) {
        return [function(callback) {
            let text = '';

            process.stdin
                .setEncoding('utf8')
                .on('readable', () => {
                    const chunk = process.stdin.read();
                    if (chunk !== null) {
                        text += chunk;
                    }
                })
                .on('end', function() {
                    const startTime = Date.now();
                    yaspeller.checkText(text, (err, data, originalText) => {
                        onResource(
                            err,
                            err ? data : {
                                resource: filename || 'stdin',
                                data: data,
                                time: Date.now() - startTime
                            },
                            originalText
                        );
                        callback();
                    }, settings);
                });
        }];
    },
    /**
     * Prepare tasks for files.
     *
     * @param {string} resource
     * @param {Object} settings
     * @param {Function} callback
     */
    forFiles(resource, settings, callback) {
        if (isDirectory(resource)) {
            const tasks = findFiles(resource, settings.fileExtensions, settings.excludeFiles)
                .map(file => cb => yaspeller.checkFile(file, (err, data, originalText) => {
                    onResource(err, data, originalText);
                    cb();
                }, settings));

            async.parallelLimit(tasks, settings.maxRequests, callback);
        } else {
            const file = pth.resolve(resource);
            if (isExcludedFile(file, settings.excludeFiles)) {
                callback();
            } else {
                yaspeller.checkFile(file, (err, data, originalText) => {
                    onResource(err, data, originalText);
                    callback();
                }, settings);
            }
        }
    },
    /**
     * Prepare tasks for a url.
     *
     * @param {string} resource
     * @param {Object} settings
     * @param {Function} callback
     */
    forUrl(resource, settings, callback) {
        if (isSitemap(resource)) {
            yaspeller.checkSitemap(resource, callback, settings, onResource);
        } else {
            yaspeller.checkUrl(resource, (err, data, originalText) => {
                onResource(err, data, originalText);
                callback();
            }, settings);
        }
    }
};
