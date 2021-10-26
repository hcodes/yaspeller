'use strict';

const lilconfig = require('lilconfig').lilconfigSync;
const stripJsonComments = require('strip-json-comments');
const sjson = require('secure-json-parse');
const path = require('path');

const exitCodes = require('../exit-codes');
const { consoleError, consoleDebug } = require('../helpers/console');
const knownProps = require('./properties.json');
const defaultConfig = require('../../.yaspellerrc.default.json');

function loadJson(filepath, content) {
    try {
        return sjson.parse(stripJsonComments(content));
    } catch (err) {
        err.message = `JSON Error in ${filepath}:\n${err.message}`;
        throw err;
    }
}

function getType(value) {
    return Array.isArray(value) ? 'array' : typeof value;
}

/**
 * Get JSON config.
 *
 * @param {string} file
 * @returns {Object}
 */
function getConfig(file) {
    const explorer = lilconfig('yaspeller', {
        loaders: {
            '.json': loadJson,
            noExt: loadJson
        },
        searchPlaces: [
            'package.json',
            '.yaspeller.json',
            '.yaspellerrc',
            '.yaspellerrc.js',
            '.yaspellerrc.json',
        ]
    });

    let data;

    consoleDebug('Get/check config.');

    try {
        if (file) {
            data = explorer.load(file).config;
        } else {
            const result = explorer.search();
            if (result) {
                file = result.filepath;
                data = result.config;
            }
        }

        if (file) {
            consoleDebug(`Using config: ${file}`);
            checkConfigProperties(data, file);
        }
    } catch (e) {
        consoleError(e);
        process.exit(exitCodes.ERROR_CONFIG);
    }

    return {
        relativePath: path.relative('./', file || '.yaspellerrc'),
        data: data || {}
    };
}

/**
 * Get merged config.
 *
 * @param {string} filename
 * @returns {Object}
 */
function getMergedConfig(filename) {
    const config = getConfig(filename);

    return Object.assign({
        configRelativePath: config.relativePath,
    }, defaultConfig, config.data);
}

/**
 * Check config properties.
 *
 * @param {*} obj
 * @param {string|undefined} file
 */
function checkConfigProperties(obj, file) {
    obj && Object.keys(obj).forEach(prop => {
        if (knownProps[prop]) {
            let needType = knownProps[prop].type;
            let currentType = getType(obj[prop]);
            if (currentType !== needType) {
                consoleError(
                    `The type for "${prop}" property should be ${knownProps[prop].type} in "${file}" config.`
                );
            }
        } else {
            consoleError(
                `Unknown "${prop}" property in "${file}" config.`
            );
        }
    });
}

module.exports = {
    defaultConfig,
    getConfig,
    getMergedConfig,
};
