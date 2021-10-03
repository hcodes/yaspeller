'use strict';

const program = require('commander');

const { defaultConfig } = require('../config');

const { uniq } = require('../helpers/array');
const { consoleError } = require('../helpers/console');
const { splitByCommas } = require('../helpers/string');

const consoleReport = require('./console');
const errorDictionaryReport = require('./error_dictionary');
const htmlReport = require('./html');
const jsonReport = require('./json');
const junitReport = require('./junit');
const markdownReport = require('./markdown');

class Reports {
    constructor() {
        this.buffer = [];

        this.innerReports = [
            consoleReport,
            errorDictionaryReport,
            htmlReport,
            jsonReport,
            junitReport,
            markdownReport,
        ];

        this.innerReportsByName = this.innerReports.reduce((acc, current) => {
            acc[current.name] = current;

            return acc;
        }, {});

        this.stats = {
            errors: 0,
            hasTypos: false,
            ok: 0,
            total: 0,
        };

        this.reports = [];
    }

    /**
     * Set reports.
     *
     * @param {string|string[]|undefined} names
     */
    set(names) {
        this.reports = [];

        if (typeof names === 'string') {
            names = splitByCommas(names);
        } else if (Array.isArray(names)) {
            names = names.map(item => item.trim());
        } else {
            names = [];
        }

        names = uniq(names).filter(Boolean);
        if (!names.length) {
            names = defaultConfig.report;
        }

        names.forEach(name => {
            const report = this.innerReportsByName[name] || this.loadExternalReport(name);
            if (report) {
                this.reports.push(report);
            }
        });
    }

    /**
     * Load external report.
     *
     * @param {string} name
     * @returns {Report|undefined}
     */
    loadExternalReport(name) {
        try {
            const report = require(require.resolve(name, {
                paths: ['./']
            }));

            if (!report.name) {
                consoleError(`Missing "name" property in report module "${name}".`);
                return;
            }

            if (!report.onStart && !report.onComplete && !report.onResourceComplete) {
                consoleError(`Missing methods (onStart, onResourceComplete or onComplete) in report module "${name}".`);
                return;
            }

            return report;
        } catch (e) {
            consoleError(e);
        }
    }

    onStart() {
        this.reports.forEach(report => {
            report.onStart && report.onStart();
        });
    }

    onResourceComplete(hasError, data, dictionary) {
        this.stats.total++;

        const hasTypos = Boolean(data && data.data && data.data.length);

        if (hasTypos) {
            this.stats.hasTypos = true;
        }

        if (hasError || hasTypos) {
            this.stats.errors++;

            this.buffer.push([hasError, data]);
        } else {
            this.stats.ok++;

            if (!program.onlyErrors) {
                this.buffer.push([hasError, data]);
            }
        }

        if (!program.onlyErrors || hasError || hasTypos) {
            this.reports.forEach(report => {
                report.onResourceComplete && report.onResourceComplete(hasError, data, dictionary);
            });
        }
    }

    onComplete(configPath) {
        this.reports.forEach(report => {
            report.onComplete && report.onComplete(this.buffer, this.stats, configPath);
        });
    }
}

module.exports = new Reports();

/**
 @typedef Report
 @type {Object}
 @property {string} name
 @property {Function?} onStart
 @property {Function?} onResourceComplete
 @property {Function?} onComplete
 */
