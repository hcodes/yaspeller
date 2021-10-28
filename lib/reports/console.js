'use strict';

const pico = require('picocolors');
const program = require('commander');

const yaspeller = require('../yaspeller');

const { uptime } = require('../helpers/uptime');
const { hasManyErrors } = require('../helpers/typos');
const { packageJson } = require('../helpers/package');
const {
    hasEngRusLetters,
    replaceRusLettersWithAsterisk,
    replaceEngLettersWithAsterisk,
} = require('../helpers/string');
const { isUrl } = require('../helpers/url');
const { okSymbol, errorSymbol } = require('../helpers/symbols');
const {
    consoleError,
    consoleOk,
    consoleWarn,
    consoleLog,
    consoleInfo,
} = require('../helpers/console');

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
            comment.push(pico.cyan(pos[0].line + ':' + pos[0].column));
        }

        if (el.count > 1) {
            comment.push(pico.cyan('count: ' + el.count));
        }

        if (hasEngRusLetters(el.word)) {
            comment.push(pico.red('en: ' + replaceRusLettersWithAsterisk(el.word)));
            comment.push(pico.green('ru: ' + replaceEngLettersWithAsterisk(el.word)));
        }

        if (el.suggest) {
            comment.push(pico.cyan('suggest: ' + el.suggest.join(', ')));
        }

        typos.push(num + '. ' + el.word + (comment.length ? ' (' + comment.join(', ') + ')' : ''));
        num++;
    });

    return typos;
}

module.exports = {
    name: 'console',
    onStart() {
        consoleLog('Spelling check:');
    },
    onResourceComplete(err, data) {
        const errors = [];
        if (err) {
            consoleError(data);
        } else {
            if (hasManyErrors(data.data)) {
                errors.push(pico.red('Too many errors\n'));
            }

            yaspeller.errors.forEach(function(el) {
                const typos = getTyposByCode(el.code, data.data);
                if (typos.length) {
                    errors.push(pico.red(el.title + ': ' +
                        typos.length + '\n') +
                        typos.join('\n') + '\n');
                }
            });

            const time = data.time ? ' ' + pico.magenta(data.time + ' ms') : '';
            const separator = pico.red('-----\n');

            let res = data.resource;

            if (isUrl(res)) {
                res = pico.underline(res);
            }

            if (errors.length) {
                console.error(pico.red(errorSymbol) +  ' ' + res + time + '\n' +
                    separator + errors.join('\n') + separator);
            } else {
                console.log(pico.green(okSymbol) + ' ' + res + time);
            }
        }
    },
    onComplete(data, stats, configPath) {
        if (!program.onlyErrors && stats.total) {
            if (stats.hasTypos) {
                let path = configPath + ' (';
                if (configPath.search(/package\.json/) !== -1) {
                    path += '"yaspeller"→';
                }

                path += '"dictionary" property)';
                consoleWarn(`Fix typo or add word to dictionary at ${path} if you are sure about spelling. Docs: ${packageJson.homepage}#configuration`);
            }

            if (!stats.errors) {
                consoleOk('No errors.');
            }

            consoleInfo('Checking finished: ' + uptime());
        }
    }
};
