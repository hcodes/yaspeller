/*jshint maxlen:1000 */
var fs = require('fs'),
    pth = require('path'),
    chalk = require('chalk'),
    _ = require('lodash'),
    buffer = [],
    startTime = Date.now();

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
    var res = resource;
    if(resource.search(/^https:/) === -1) {
        res = 'file://' + (resource.search(/^\//) ? '/' : '') + resource;
    }

    return '<a target="_blank" href="' + _.escape(encodeURI(res)) + '">' + _.escape(resource) + '</a>';
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

            [
                {
                    code: 1, // ERROR_UNKNOWN_WORD
                    title: 'Typos'
                }, {
                    code: 2, // ERROR_REPEAT_WORD
                    title: 'Repeat words'
                }, {
                    code: 3, // ERROR_CAPITALIZATION
                    title: 'Capitalization'
                }
            ].forEach(function(el) {
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

                        if(word.search(/[a-z]/i) > -1 && word.search(/[а-яё]/i) > -1) {
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
            if(!el[0] || (el[1].data && el[1].data.length)) {
                err++;
            } else {
                ok++;
            }
        });

        var dir = pth.resolve('./yaspeller'),
            template = fs.readFileSync('lib/report/template.html').toString(),
            html = '<div class="total">Processed resources: ' + total +
                ' (<span class="sym-err">&chi;</span>' + '&ndash; ' + err + '</span>, <span class="sym-ok">&checkmark;</span>&ndash; ' + ok + ')<br/>' +
                'Checking finished: ' + ((+new Date() - startTime) / 1000) + ' sec.' + '</div>' +
                buffer.join('');

        try {
            if(!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            fs.writeFileSync(pth.join(dir, 'report.html'), template.replace(/\{\{content\}\}/, html));
            console.log(chalk.cyan('HTML report: ./yaspeller/report.html'));
        } catch(e) {
            console.error(e);
        }
    }
};
