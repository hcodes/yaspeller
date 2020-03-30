'use strict';

const program = require('commander');
const pth = require('path');

const { consoleError } = require('../helpers/console');

const stats = {
    errors: 0,    
    hasTypos: false,
    ok: 0,
    total: 0,
};
const reports = [];
const reportNames = new Set();
const buffer = [];

module.exports = {
    addReports(names) {
        names.forEach(function(name) {
            const moduleName = pth.extname(name) === '.js' ? name : './' + name;

            if (reportNames.has(moduleName)) {
                return;
            }

            try {
                reports.push(require(moduleName));
                reportNames.add(moduleName);
            } catch (e) {
                consoleError(`Can't load report module "${moduleName}".`);
                consoleError(e);
            }
        });
    },
    onStart() {
        reports.forEach(function(name) {
            name.onStart && name.onStart();
        });
    },
    onResourceComplete(hasError, data, dictionary) {
        stats.total++;

        const hasTypos = Boolean(data && data.data && data.data.length);

        if (hasTypos) {
            stats.hasTypos = true;
        }

        if (hasError || hasTypos) {
            stats.errors++;

            buffer.push([hasError, data]);
        } else {
            stats.ok++;

            if (!program.onlyErrors) {
                buffer.push([hasError, data]);
            }
        }

        if (!program.onlyErrors || hasError || hasTypos) {
            reports.forEach(function(name) {
                name.onResourceComplete && name.onResourceComplete(hasError, data, dictionary);
            });
        }
    },
    onComplete(configPath) {
        reports.forEach(function(name) {
            name.onComplete && name.onComplete(buffer, stats, configPath);
        });
    }
};
