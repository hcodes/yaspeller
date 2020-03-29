'use strict';

const chalk = require('chalk');
const cosmiconfig = require('cosmiconfig').cosmiconfigSync;
const stripJsonComments = require('strip-json-comments');
const parseJson = require('parse-json');
const path = require('path');

const { printDebugInfo } = require('./helpers/debug');
const exitCodes = require('./exit-codes');
const knownProps = require('./config-properties');

function loadJson(filepath, content) {
    try {
        return parseJson(stripJsonComments(content));
    } catch (err) {
        err.message = `JSON Error in ${filepath}:\n${err.message}`;
        throw err;
    }
}

module.exports = {
    /**
     * Get JSON config.
     *
     * @param {string} file
     * @returns {Object}
     */
    get(file) {
        const explorer = cosmiconfig('yaspeller', {
            loaders: {
                '.json': loadJson,
                noExt: loadJson
            },
            searchPlaces: [
                'package.json',
                '.yaspellerrc',
                '.yaspeller.json'
            ]
        });
        let data;

        printDebugInfo('Get/check config.');

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
                printDebugInfo(`Using config: ${file}`);
                this.checkProps(data, file);
            }
        } catch (e) {
            console.error(chalk.red(e));
            process.exit(exitCodes.ERROR_CONFIG);
        }

        return {
            relativePath: path.relative('./', file || '.yaspellerrc'),
            data: data || {}
        };
    },

    /**
     * Check properties in config.
     * 
     * @param {*} obj
     * @param {string|undefined} file
     */
    checkProps(obj, file) {
        obj && Object.keys(obj).forEach(function(prop) {
            if (knownProps[prop]) {
                let needType = knownProps[prop].type;
                let currentType = this._getType(obj[prop]);
                if (currentType !== needType) {
                    console.error(chalk.red(
                        `The type for "${prop}" property should be ${knownProps[prop].type} in "${file}" config.`
                    ));
                }
            } else {
                console.error(chalk.red(
                    `Unknown "${prop}" property in "${file}" config.`
                ));
            }
        }, this);
    },
    _getType(value) {
        return Array.isArray(value) ? 'array' : typeof value;
    }
};
