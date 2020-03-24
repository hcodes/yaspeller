'use strict';

const chalk = require('chalk');
const program = require('commander');
const pth = require('path');

const stats = {
    errors: 0,    
    hasTypos: false,
    ok: 0,
    total: 0,
};
const reports = [];
const reportNames = {};
const buffer = [];

module.exports = {
    addReports(names) {
        names.forEach(function(name) {
            const moduleName = pth.extname(name) === '.js' ? name : './report/' + name;
            if (reportNames[moduleName]) {
                return;
            }

            try {
                reportNames[moduleName] = true;
                reports.push(require(moduleName));
            } catch (e) {
                console.error(chalk.red('Can\'t load report module "' + moduleName + '".'));
                console.error(chalk.red(e));
            }
        });
    },
    onstart() {
        reports.forEach(function(name) {
            name.onstart && name.onstart();
        });
    },
    oneach(hasError, data, dictionary) {
        const hasTypos = Boolean(data && data.data && data.data.length);

        stats.total++;

        if (hasError || hasTypos) {
            stats.errors++;

            if (hasTypos) {
                stats.hasTypos = true;
            }

            buffer.push([hasError, data]);
        } else {
            stats.ok++;

            if (!program.onlyErrors) {
                buffer.push([hasError, data]);
            }
        }

        if (!program.onlyErrors || hasError || hasTypos) {
            reports.forEach(function(name) {
                name.oneach && name.oneach(hasError, data, dictionary);
            });
        }
    },
    onend(configPath) {
        reports.forEach(function(name) {
            name.onend && name.onend(buffer, stats, configPath);
        });
    }
};
