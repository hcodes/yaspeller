'use strict';

const fs = require('fs');
const pth = require('path');
const chalk = require('chalk');
const utils = require('../utils');
const yaspeller = require('../yaspeller');
const _ = require('lodash');

var buffer = [];

function prepareResource(resource) {
    var relativeFile = resource;
    if (!utils.isUrl(resource)) {
        relativeFile = pth.relative('.', resource);
        // CI: short links
        if (relativeFile.indexOf('..') !== -1) {
            relativeFile = resource;
        }
    }

    return _.escape(relativeFile);
}

module.exports = {
    filename: 'yaspeller_report.md',
    oneach: function(err, data) {
        var text = [];
        if (err) {
            text.push('**' + data + '**<br/><br/>\n');
        } else {
            if (utils.hasManyErrors(data.data)) {
                text.push('**Too many errors.**<br/><br/>\n');
            }

            yaspeller.errors.forEach(function(el) {
                var typos = utils.getTyposByCode(el.code, data.data);
                if (typos.length) {
                    text.push('**' + el.title + '**\n\n' +
                        '|Num.|Typo|Count|Suggest|Comment|\n' +
                        '|---:|----|----:|-------|-------|');
                    typos.forEach(function(el, i) {
                        var comment = [],
                            word = el.word,
                            buf = [];

                        if (utils.hasEnRu(word)) {
                            comment.push('`en: ' + _.escape(utils.replaceRu(word)) + '`');
                            comment.push('`ru: ' + _.escape(utils.replaceEn(word)) + '`');
                        }

                        buf.push('|' + (i + 1));
                        buf.push('|`' + _.escape(el.word) + '`');
                        buf.push('|' + el.count);
                        buf.push('|' + (el.suggest ? (el.suggest.map(function(w) {
                            return '`' + _.escape(w) + '`';
                        }).join(', ')) : '&nbsp;'));
                        buf.push('|' + (comment.length ? comment.join('<br/>') : '&nbsp;') + '|\n');

                        text.push(buf.join(''));
                    });
                }
            });

            var time = data.time ? data.time + ' ms' : '';
            text.unshift((data.data && data.data.length ? '<br/>χ' : '✓') +
                ' `' + prepareResource(data.resource) + '` – ' + time + '<br/>\n');
        }

        buffer.push(text.join('\n'));
    },
    onend: function(data, stats) {
        var text = '<br/><br/>Processed resources: ' + stats.total +
                ' (χ – ' + stats.errors + ', ✓ – ' + stats.ok + ')<br/>' +
                'Checking finished: ' + utils.uptime() + '<br/><br/>\n' +
                buffer.join('');

        try {
            fs.writeFileSync(this.filename, text);
            console.log(chalk.cyan('Markdown report: ./' + this.filename));
        } catch(e) {
            console.error(chalk.red(e));
        }
    }
};
