'use strict';

var chalk = require('chalk'),
    program = require('commander'),
    utils = require('../utils'),
    yaspeller = require('../yaspeller');

function getTyposByCode(code, data) {
    var typos = [],
        num = 1;
    data.forEach(function(el, i) {
        if(el.code !== code) {
            return;
        }

        var comment = [],
            word = el.word;

        if(el.count > 1) {
            comment.push(chalk.cyan('count: ' + el.count));
        }

        if(utils.hasEnRu(word)) {
            comment.push(chalk.red('en: ' + utils.replaceRu(word)));
            comment.push(chalk.green('ru: ' + utils.replaceEn(word)));
        }

        if(el.suggest) {
            comment.push(chalk.cyan('suggest: ' + el.suggest.join(', ')));
        }

        typos.push(num + '. ' + word + (comment.length ? ' (' + comment.join(', ') + ')' : ''));
        num++;
    });

    return typos;
}

module.exports = {
    oneach: function(err, data) {
        var errors = [];
        if(err) {
            console.error(chalk.red(data));
        } else {
            if(utils.hasManyErrors(data.data)) {
                errors.push(chalk.red('Too many errors'));
            }

            yaspeller.errors.forEach(function(el) {
                var typos = getTyposByCode(el.code, data.data);
                if(typos.length) {
                    errors.push(chalk.red(el.title + ': ' +
                        typos.length + '\n') +
                        typos.join('\n') + '\n');
                }
            });

            var time = data.time ? ' ' + chalk.magenta(data.time + ' ms') : '',
                separator = chalk.red('-----\n'),
                res = data.resource;

            if(utils.isUrl(res)) {
                res = chalk.underline(res);
            }

            if(errors.length) {
                console.error(chalk.red(utils.errSym) +  ' ' + res + time + '\n' +
                    separator + errors.join('\n') + separator);
            } else {
                console.log(chalk.green(utils.okSym) + ' ' + res + time);
            }
        }
    },
    onend: function(data, stats) {
        if(!program.onlyErrors && stats.total) {
            if(!stats.errors) {
                console.log(chalk.green('No errors.'));
            }

            console.log(chalk.magenta('Checking finished: ' + utils.uptime()));
        }
    }
};
