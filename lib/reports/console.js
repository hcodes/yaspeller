'use strict';

const chalk = require('chalk');
const program = require('commander');

const { uptime } = require('../helpers/uptime');
const { hasManyErrors } = require('../helpers/typos');
const yaspeller = require('../yaspeller');
const packageJson = require('../../package.json');
const {
    hasEngRusLetters,
    replaceRusLettersWithAsterisk,
    replaceEngLettersWithAsterisk,
} = require('../helpers/string');
const { isUrl } = require('../helpers/url');
const { okSymbol, errorSymbol } = require('../helpers/symbols');

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

        if (hasEngRusLetters(el.word)) {
            comment.push(chalk.red('en: ' + replaceRusLettersWithAsterisk(el.word)));
            comment.push(chalk.green('ru: ' + replaceEngLettersWithAsterisk(el.word)));
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
    onstart() {
        console.log('Spelling check:');
    },
    oneach(err, data) {
        const errors = [];
        if (err) {
            console.error(chalk.red(data));
        } else {
            if (hasManyErrors(data.data)) {
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

            if (isUrl(res)) {
                res = chalk.underline(res);
            }

            if (errors.length) {
                console.error(chalk.red(errorSymbol) +  ' ' + res + time + '\n' +
                    separator + errors.join('\n') + separator);
            } else {
                console.log(chalk.green(okSymbol) + ' ' + res + time);
            }
        }
    },
    onend(data, stats, configPath) {
        if (!program.onlyErrors && stats.total) {
            if (stats.hasTypos) {
                let path = configPath + ' (';
                if (configPath.search(/package\.json/) !== -1) {
                    path += '"yaspeller"→';
                }

                path += '"dictionary" property)';
                console.log(chalk.yellow(`Fix typo or add word to dictionary at ${path} if you are sure about spelling. Docs: ${packageJson.homepage}#configuration`));
            }
            
            if (!stats.errors) {
                console.log(chalk.green('No errors.'));
            }

            if (program.debug) {
                console.log(chalk.magenta('Checking finished: ' + uptime()));
            }
        }
    }
};
