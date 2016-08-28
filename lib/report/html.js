'use strict';

const fs = require('fs');
const pth = require('path');
const chalk = require('chalk');
const utils = require('../utils');
const yaspeller = require('../yaspeller');
const escape = require('escape-html');

const buffer = [];

function makeLink(resource) {
    let href = resource;
    let relativeFile = resource;

    if (!utils.isUrl(resource)) {
        relativeFile = pth.relative('.', resource);
        // CI: short links
        if (relativeFile.indexOf('..') !== -1) {
            relativeFile = resource;
        }

        href = fileUrl(href);
    }

    return '<a target="_blank" href="' +
            escape(encodeURI(href)) + '" title="' +
            escape(resource) + '">' +
            escape(relativeFile) + '</a>';
}

function fileUrl(file) {
    return 'file://localhost' +
        (file.search(/^\//) === -1 ? '/' : '') +
        file.replace(/\\/g, '/');
}

module.exports = {
    filename: 'yaspeller_report.html',
    oneach(err, data) {
        const html = [];
        if (err) {
            html.push('<div class="syserr">' + data + '</div>');
        } else {
            const time = data.time ? '<span class="time">' + data.time + ' ms</span>' : '';
            if (data.data && data.data.length) {
                html.push('<div class="err"><span class="sym-err">χ</span>' + makeLink(data.resource) + time + '</div>');
            } else {
                html.push('<div class="ok"><span class="sym-ok">✓</span>' + makeLink(data.resource) + time + '</div>');
            }

            html.push('<div class="typo">');
            if (utils.hasManyErrors(data.data)) {
                html.push('<div class="title">Too many errors.</div>');
            }

            yaspeller.errors.forEach(function(el) {
                const typos = utils.getTyposByCode(el.code, data.data);
                if (typos.length) {
                    html.push('<table class="table"><caption>' + el.title + '</caption>');
                    html.push('<tr><th class="table-num">Num.</th>' +
                        '<th class="table-name">Typo</th>' +
                        '<th class="table-count">Count</th>' +
                        '<th class="table-suggest">Suggest</th>' +
                        '<th class="table-comment">Comment</th></tr>');
                    typos.forEach(function(el, i) {
                        const comment = [];
                        const suggest = el.suggest ? el.suggest.map(w => '<span class="word">' + escape(w) + '</span>').join(', ') : '';

                        if (utils.hasEnRu(el.word)) {
                            comment.push('<code class="letters-en">en: ' + escape(utils.replaceRu(el.word)) + '</code>');
                            comment.push('<code class="letters-ru">ru: ' + escape(utils.replaceEn(el.word)) + '</code>');
                        }

                        html.push('<tr>');
                        html.push('<td class="table-num">' + (i + 1) + '.</td>');
                        html.push('<td class="table-name"><span class="word">' + escape(el.word) + '</span></td>');
                        html.push('<td class="table-count">' + el.count + '</td>');
                        html.push('<td class="table-suggest">' + suggest + '</td>');
                        html.push('<td class="table-comment">' + (comment.length ? comment.join('<br/>') : '') + '</td>');
                        html.push('</tr>');
                    });

                    html.push('</table>');
                }
            });

            html.push('</div>');
        }

        buffer.push(html.join('\n'));
    },
    _prepareTemplate(params) {
        return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>yaspeller report</title>
    <style>${params.css}</style>
  </head>
  <body class="show-only-errors_checked">
    <div class="page">${params.content}</div>
    <script>${params.js}</script>
  </body>
</html>`;
    },
    onend(data, stats) {
        const content = '<div class="total">Processed resources: ' + stats.total +
                ' (<span class="sym-err">χ</span>– ' + stats.errors +
                '</span>, <span class="sym-ok-group"><span class="sym-ok">✓</span>– ' + stats.ok + '</span>) ' +
                '<label><input class="show-only-errors" autocomplete="off" checked="checked" type="checkbox" /> Only errors</label>' +
                '<br/>Checking finished: ' + utils.uptime() + '</div>' +
                buffer.join('');

        try {
            fs.writeFileSync(this.filename, this._prepareTemplate({
                css: this._loadFile('template.css'),
                js: this._loadFile('template.js'),
                content: content
            }));
            console.log(chalk.cyan('HTML report: ./' + this.filename));
        } catch(e) {
            console.error(chalk.red(e));
        }
    },
    _loadFile(filename) {
        return fs.readFileSync(pth.join(__dirname, 'html/' + filename)).toString();
    }
};
