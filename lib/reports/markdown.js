'use strict';

const fs = require('fs');
const escape = require('escape-html');
const pth = require('path');
const {
    hasEngRusLetters,
    replaceEngLettersWithAsterisk,
    replaceRusLettersWithAsterisk,
} = require('../helpers/string');
const { isUrl } = require('../helpers/url');
const { hasManyErrors, getTyposByCode } = require('../helpers/typos');
const { uptime } = require('../helpers/uptime');
const { consoleError, consoleInfo } = require('../helpers/console');
const yaspeller = require('../yaspeller');

const buffer = [];

function prepareResource(resource) {
    let relativeFile = resource;
    if (!isUrl(resource)) {
        relativeFile = pth.relative('.', resource);
        // CI: short links
        if (relativeFile.indexOf('..') !== -1) {
            relativeFile = resource;
        }
    }

    return escape(relativeFile);
}

const filename = 'yaspeller_report.md';

module.exports = {
    name: 'markdown',
    onResourceComplete(err, data) {
        const text = [];
        if (err) {
            text.push('**' + data + '**<br/><br/>\n');
        } else {
            if (hasManyErrors(data.data)) {
                text.push('**Too many errors.**<br/><br/>\n');
            }

            yaspeller.errors.forEach(function(el) {
                const typos = getTyposByCode(el.code, data.data);
                if (typos.length) {
                    text.push('**' + el.title + '**\n\n' +
                        '|Num.|Typo|Line:Col|Suggest|Comment|\n' +
                        '|---:|----|--------|-------|-------|');
                    typos.forEach(function(el, i) {
                        const comment = [];
                        const pos = el.position;
                        const suggest = el.suggest ? el.suggest.map(word => '`' + escape(word) + '`').join(', ') : '&nbsp;';

                        if (hasEngRusLetters(el.word)) {
                            comment.push('`en: ' + escape(replaceRusLettersWithAsterisk(el.word)) + '`');
                            comment.push('`ru: ' + escape(replaceEngLettersWithAsterisk(el.word)) + '`');
                        }

                        text.push([
                            '',
                            i + 1,
                            '`' + escape(el.word) + '`' + (el.count > 1 ? ' <sup>' + el.count + '</sup>' : ''),
                            pos.length ? pos[0].line + ':' + pos[0].column : '&nbsp;',
                            suggest,
                            comment.length ? comment.join('<br/>') : '&nbsp;',
                            ''
                        ].join('|'));
                    });
                }
            });

            const time = data.time ? data.time + ' ms' : '';
            text.unshift((data.data && data.data.length ? '<br/>χ' : '✓') +
                ' `' + prepareResource(data.resource) + '` – ' + time + '<br/>\n');
        }

        buffer.push(text.join('\n'));
    },
    onComplete(data, stats) {
        const text = '<br/><br/>Processed resources: ' + stats.total +
                ' (χ – ' + stats.errors + ', ✓ – ' + stats.ok + ')<br/>' +
                'Checking finished: ' + uptime() + '<br/><br/>\n' +
                buffer.join('');

        try {
            fs.writeFileSync(filename, text);
            consoleInfo(`Markdown report: ./${filename}`);
        } catch (e) {
            consoleError(e);
        }
    }
};
