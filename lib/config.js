'use strict';

const chalk = require('chalk');
const cosmiconfig = require('cosmiconfig');
const debug = require('./debug');
const printDebug = debug.print;
const exitCodes = require('./exit-codes');
const knownProps = require('./config-properties');

module.exports = {
    /**
     * Get JSON config.
     *
     * @param {string} file
     * @returns {Object}
     */
    get(file) {
        const explorer = cosmiconfig('yaspeller', {
            searchPlaces: [
                'package.json',
                '.yaspellerrc',
                '.yaspeller.json'
            ]
        });
        let data;

        printDebug('Get/check config.');

        try {
            if (file) {
                data = explorer.loadSync(file).config;
            } else {
                const { config, filepath } = explorer.searchSync();
                file = filepath.split('/').slice(-1)[0];
                data = config;
            }

            printDebug(`Using config: ${file}`);

            this.checkProps(data, file);
        } catch (e) {
            console.error(chalk.red(e));
            process.exit(exitCodes.ERROR_CONFIG);
        }

        return data || {};
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
