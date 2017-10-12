'use strict';

const chalk = require('chalk');
const program = require('commander');
const pth = require('path');

const stats = {
    total: 0,
    errors: 0,
    ok: 0
};
const reports = [];
const reportNames = {};
const buffer = [];

module.exports = {
    addReports(names) {
        names.forEach(function(name) {
            var moduleName = pth.extname(name) === '.js' ? name : './report/' + name;
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
    oneach(err, data, dictionary) {
        var isError = err || (!err && data.data && data.data.length);
        stats.total++;

        if (isError) {
            stats.errors++;

            buffer.push([err, data]);
        } else {
            stats.ok++;

            if (!program.onlyErrors) {
                buffer.push([err, data]);
            }
        }

        if ((program.onlyErrors && isError) || !program.onlyErrors) {
            reports.forEach(function(name) {
                name.oneach && name.oneach(err, data, dictionary);
            });
        }
    },
    onend() {
        reports.forEach(function(name) {
            name.onend && name.onend(buffer, stats);
        });
    }
};
