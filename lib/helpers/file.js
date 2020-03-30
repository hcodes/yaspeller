'use strict';

const fs = require('fs');
const isutf8 = require('isutf8');
const minimatch = require('minimatch');
const pth = require('path');
const stripJsonComments = require('strip-json-comments');

/**
 * Is directory?
 *
 * @param {string} path
 * @returns {boolean}
 */
function isDirectory(path) {
    return fs.statSync(path).isDirectory();
}

/**
 * Load file as JSON with comments.
 *
 * @param {string} file
 * @param {boolean} [throwIfFileNotExists]
 * @returns {*}
 */
function loadFileAsJson(file, throwIfFileNotExists) {
    let data;

    if (fs.existsSync(file)) {
        let json = fs.readFileSync(file);
        if (isutf8(json)) {
            json = json.toString('utf-8');
            if (pth.extname(file) === '.js') {
                try {
                    data = require(pth.resolve(file));
                } catch (e) {
                    throw new Error(e);
                }
            } else {
                try {
                    json = stripJsonComments(json);
                    data = JSON.parse(json);
                } catch (e) {
                    throw new Error(`Error parsing in the file: ${file}`);
                }
            }
        } else {
            throw new Error(`${file}: is not UTF-8.`);
        }
    } else if (throwIfFileNotExists) {
        throw new Error(`${file}: is not exists.`);
    }

    return data;
}

/**
 * Find files to search for typos.
 *
 * @param {string} dir
 * @param {string[]} fileExtensions
 * @param {string[]} excludeFiles
 * @returns {Object[]}
 */
function findFiles(dir, fileExtensions, excludeFiles) {
    const result = [];
    const find = path => {
        fs.readdirSync(path).forEach(el => {
            const file = pth.resolve(path, el);

            if (fs.existsSync(file) && !isExcludedFile(file, excludeFiles)) {
                if (isDirectory(file)) {
                    find(file);
                } else if (isRequiredFileExtension(file, fileExtensions)) {
                    result.push(file);
                }
            }
        });
    };

    if (isDirectory(dir)) {
        find(dir);
    } else {
        result.push(dir);
    }

    return result;
}

/**
 * Is required file extension?
 *
 * @param {string} file
 * @param {string[]} fileExtensions
 * @returns {boolean}
 */
function isRequiredFileExtension(file, fileExtensions) {
    const buf = fileExtensions.filter(ext => ext.trim());
    return !buf.length || buf.some(ext => ext === file.slice(ext.length * -1));
}

/**
 * Is excluded file?
 *
 * @param {string} file
 * @param {string[]} excludeFiles
 * @returns {boolean}
 */
function isExcludedFile(file, excludeFiles) {
    return excludeFiles.some(el => minimatch(file, pth.resolve(el), {dot: true}));
}

module.exports = {
    isDirectory,
    isRequiredFileExtension,
    isExcludedFile,
    findFiles,
    loadFileAsJson,
};
