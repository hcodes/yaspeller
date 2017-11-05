'use strict';

const chalk = require('chalk');
const program = require('commander');
const utils = require('../utils');
const yaspeller = require('../yaspeller');

function getTyposByCode(code, data) {
    let typos = [];
    let num = 1;

    data.forEach(function(el) {
        if (el.code !== code) {
            return;
        }

        const comment = [];
        const pos = el.position;

        if (pos.length) {
            comment.push(chalk.cyan(pos[0].line + ':' + pos[0].column));
        }

        if (el.count > 1) {
            comment.push(chalk.cyan('count: ' + el.count));
        }

        if (utils.hasEnRu(el.word)) {
            comment.push(chalk.red('en: ' + utils.replaceRu(el.word)));
            comment.push(chalk.green('ru: ' + utils.replaceEn(el.word)));
        }

        if (el.suggest) {
            comment.push(chalk.cyan('suggest: ' + el.suggest.join(', ')));
        }

        typos.push(num + '. ' + el.word + (comment.length ? ' (' + comment.join(', ') + ')' : ''));
        num++;
    });

    return typos;
}

module.exports = {
    oneach(err, data) {
        const errors = [];
        if (err) {
            console.error(chalk.red(data));
        } else {
            if (utils.hasManyErrors(data.data)) {
                errors.push(chalk.red('Too many errors\n'));
            }

            yaspeller.errors.forEach(function(el) {
                const typos = getTyposByCode(el.code, data.data);
                if (typos.length) {
                    errors.push(chalk.red(el.title + ': ' +
                        typos.length + '\n') +
                        typos.join('\n') + '\n');
                }
            });

            const time = data.time ? ' ' + chalk.magenta(data.time + ' ms') : '';
            const separator = chalk.red('-----\n');

            let res = data.resource;

            if (utils.isUrl(res)) {
                res = chalk.underline(res);
            }

            if (errors.length) {
                console.error(chalk.red(utils.errSym) +  ' ' + res + time + '\n' +
                    separator + errors.join('\n') + separator);
            } else {
                console.log(chalk.green(utils.okSym) + ' ' + res + time);
            }
        }
    },
    onend(data, stats) {
        if (!program.onlyErrors && stats.total) {
            if (!stats.errors) {
                console.log(chalk.green('No errors.'));
            }

            console.log(chalk.magenta('Checking finished: ' + utils.uptime()));
        }
    }
};
