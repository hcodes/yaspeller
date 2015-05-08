/*jshint maxlen:1000 */
var fs = require('fs'),
    pth = require('path'),
    chalk = require('chalk'),
    utils = require('../utils'),
    yaspeller = require('../yaspeller'),
    _ = require('lodash'),
    buffer = [];

function getTypos(data, code) {
    var typos = [];
    data.forEach(function(el) {
        if(el.code !== code) {
            return;
        }

        typos.push(el);
    });

    return typos;
}

function hasManyErrors(data) {
    return data.some(function(el) {
        return el.code === 4; // ERROR_TOO_MANY_ERRORS
    });
}

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
    oneach: function(err, data) {
        var html = [];
        if(err) {
            html.push('<div class="syserr">' + data + '</div>');
        } else {
            html.push('<div class="typo">');
            if(hasManyErrors(data.data)) {
                html.push('<div class="title">Too many errors</div>');
            }

            yaspeller.errors.forEach(function(el) {
                var typos = getTypos(data.data, el.code);
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
                            comment.push('<code class="letters-en">en: ' + _.escape(word.replace(/[а-яё]/gi, '*')) + '</code>');
                            comment.push('<code class="letters-ru">ru: ' + _.escape(word.replace(/[a-z]/gi, '*')) + '</code>');
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

            var time = data.time ? '<span class="time">' + data.time + ' ms</span>' : '';
            if(data.data && data.data.length) {
                html.unshift('<div class="err"><span class="sym-err">&chi;</span>' + makeLink(data.resource) + time + '</div>');
            } else {
                html.unshift('<div class="ok"><span class="sym-ok">&checkmark;</span>' + makeLink(data.resource) + time + '</div>');
            }

            html.push('</div>');
        }

        buffer.push(html.join('\n'));
    },
    onend: function(data) {
        var total = 0,
            err = 0,
            ok = 0;

        data.forEach(function(el) {
            total++;
            if(el[0] || (!el[0] && el[1].data && el[1].data.length)) {
                err++;
            } else {
                ok++;
            }
        });

        var template = fs.readFileSync(pth.join(__dirname, 'template.html')).toString(),
            filename = 'yaspeller_report.html',
            html = '<div class="total">Processed resources: ' + total +
                ' (<span class="sym-err">&chi;</span>&ndash; ' + err +
                '</span>, <span class="sym-ok">&checkmark;</span>&ndash; ' + ok + ')<br/>' +
                'Checking finished: ' + process.uptime() + ' sec.</div>' +
                buffer.join('');

        try {
            fs.writeFileSync(filename, template.replace(/\{\{content\}\}/, html));
            console.log(chalk.cyan('HTML report: ./' + filename));
        } catch(e) {
            console.error(chalk.red(e));
        }
    }
};
