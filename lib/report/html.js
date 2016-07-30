'use strict';

/*jshint maxlen:1000 */
var fs = require('fs'),
    pth = require('path'),
    chalk = require('chalk'),
    utils = require('../utils'),
    yaspeller = require('../yaspeller'),
    _ = require('lodash'),
    buffer = [];

function makeLink(resource) {
    var href = resource,
        relativeFile = resource;
    if(!utils.isUrl(resource)) {
        relativeFile = pth.relative('.', resource);
        // CI: short links
        if(relativeFile.indexOf('..') !== -1) {
            relativeFile = resource;
        }

        href = fileUrl(href);
    }

    return '<a target="_blank" href="' +
            _.escape(encodeURI(href)) + '" title="' +
            _.escape(resource) + '">' +
            _.escape(relativeFile) + '</a>';
}

function fileUrl(file) {
    return 'file://localhost' +
        (file.search(/^\//) === -1 ? '/' : '') +
        file.replace(/\\/g, '/');
}

module.exports = {
    filename: 'yaspeller_report.html',
    oneach: function(err, data) {
        var html = [];
        if(err) {
            html.push('<div class="syserr">' + data + '</div>');
        } else {
            var time = data.time ? '<span class="time">' + data.time + ' ms</span>' : '';
            if(data.data && data.data.length) {
                html.push('<div class="err"><span class="sym-err">χ</span>' + makeLink(data.resource) + time + '</div>');
            } else {
                html.push('<div class="ok"><span class="sym-ok">✓</span>' + makeLink(data.resource) + time + '</div>');
            }

            html.push('<div class="typo">');
            if(utils.hasManyErrors(data.data)) {
                html.push('<div class="title">Too many errors.</div>');
            }

            yaspeller.errors.forEach(function(el) {
                var typos = utils.getTyposByCode(el.code, data.data);
                if(typos.length) {
                    html.push('<table class="table"><caption>' + el.title + '</caption>');
                    html.push('<tr><th class="table-num">Num.</th>' +
                        '<th class="table-name">Typo</th>' +
                        '<th class="table-count">Count</th>' +
                        '<th class="table-suggest">Suggest</th>' +
                        '<th class="table-comment">Comment</th></tr>');
                    typos.forEach(function(el, i) {
                        var comment = [],
                            word = el.word;

                        if(utils.hasEnRu(word)) {
                            comment.push('<code class="letters-en">en: ' + _.escape(utils.replaceRu(word)) + '</code>');
                            comment.push('<code class="letters-ru">ru: ' + _.escape(utils.replaceEn(word)) + '</code>');
                        }

                        html.push('<tr>');
                        html.push('<td class="table-num">' + (i + 1) + '.</td>');
                        html.push('<td class="table-name"><span class="word">' + _.escape(el.word) + '</span></td>');
                        html.push('<td class="table-count">' + el.count + '</td>');
                        html.push('<td class="table-suggest">' + (el.suggest ? (el.suggest.map(function(w) {
                            return '<span class="word">' + _.escape(w) + '</span>';
                        }).join(', ')) : '') + '</td>');
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
    onend: function(data, stats) {
        var compiled = _.template(this._loadFile('template.html')),
            content = '<div class="total">Processed resources: ' + stats.total +
                ' (<span class="sym-err">χ</span>– ' + stats.errors +
                '</span>, <span class="sym-ok-group"><span class="sym-ok">✓</span>– ' + stats.ok + '</span>) ' +
                '<label><input class="show-only-errors" autocomplete="off" checked="checked" type="checkbox" /> Show only errors</label>' +
                '<br/>Checking finished: ' + utils.uptime() + '</div>' +
                buffer.join('');

        try {
            fs.writeFileSync(this.filename, compiled({
                css: this._loadFile('template.css'),
                js: this._loadFile('template.js'),
                content: content
            }));
            console.log(chalk.cyan('HTML report: ./' + this.filename));
        } catch(e) {
            console.error(chalk.red(e));
        }
    },
    _loadFile: function(filename) {
        return fs.readFileSync(pth.join(__dirname, 'html/' + filename)).toString();
    }
};
