'use strict';

const fs = require('fs');
const escape = require('escape-html');
const pth = require('path');
const chalk = require('chalk');
const utils = require('../utils');
const yaspeller = require('../yaspeller');

const buffer = [];

function prepareResource(resource) {
    let relativeFile = resource;
    if (!utils.isUrl(resource)) {
        relativeFile = pth.relative('.', resource);
        // CI: short links
        if (relativeFile.indexOf('..') !== -1) {
            relativeFile = resource;
        }
    }

    return escape(relativeFile);
}

module.exports = {
    filename: 'yaspeller_report.md',
    oneach(err, data) {
        const text = [];
        if (err) {
            text.push('**' + data + '**<br/><br/>\n');
        } else {
            if (utils.hasManyErrors(data.data)) {
                text.push('**Too many errors.**<br/><br/>\n');
            }

            yaspeller.errors.forEach(function(el) {
                const typos = utils.getTyposByCode(el.code, data.data);
                if (typos.length) {
                    text.push('**' + el.title + '**\n\n' +
                        '|Num.|Typo|Line:Col|Suggest|Comment|\n' +
                        '|---:|----|--------|-------|-------|');
                    typos.forEach(function(el, i) {
                        const buf = [];
                        const comment = [];
                        const pos = el.position;
                        const suggest = el.suggest ? el.suggest.map(word => '`' + escape(word) + '`').join(', ') : '&nbsp;';

                        if (utils.hasEnRu(el.word)) {
                            comment.push('`en: ' + escape(utils.replaceRu(el.word)) + '`');
                            comment.push('`ru: ' + escape(utils.replaceEn(el.word)) + '`');
                        }

                        buf.push('|' + (i + 1));
                        buf.push('|`' + escape(el.word) + '`' + (el.count > 1 ? ' <sup>' + el.count + '</sup>' : ''));
                        buf.push('|' + (pos.length ? pos[0].line + ':' + pos[0].column : '&nbsp;'));
                        buf.push('|' + suggest);
                        buf.push('|' + (comment.length ? comment.join('<br/>') : '&nbsp;') + '|');

                        text.push(buf.join(''));
                    });
                }
            });

            const time = data.time ? data.time + ' ms' : '';
            text.unshift((data.data && data.data.length ? '<br/>χ' : '✓') +
                ' `' + prepareResource(data.resource) + '` – ' + time + '<br/>\n');
        }

        buffer.push(text.join('\n'));
    },
    onend(data, stats) {
        const text = '<br/><br/>Processed resources: ' + stats.total +
                ' (χ – ' + stats.errors + ', ✓ – ' + stats.ok + ')<br/>' +
                'Checking finished: ' + utils.uptime() + '<br/><br/>\n' +
                buffer.join('');

        try {
            fs.writeFileSync(this.filename, text);
            console.log(chalk.cyan('Markdown report: ./' + this.filename));
        } catch (e) {
            console.error(chalk.red(e));
        }
    }
};
