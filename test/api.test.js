const yaspeller = require('../lib/yaspeller');
const { setDebugMode } = require('../lib/helpers/debug');
const assert = require('chai').assert;
const fs = require('fs');
const url404 = 'https://raw.githubusercontent.com/asd9qi9e91ke9k2k193k19';
const urlUnknown = 'http://dk02keoqwke02keoqwwer923mr923.info/';
const urlGH = 'https://raw.githubusercontent.com/hcodes/yaspeller/master/test/texts/';
const getFile = name => fs.readFileSync(name).toString('utf-8');

setDebugMode(true);

describe('API', function() {
    this.timeout(10000);

    it('checkFile', function(done) {
        yaspeller.checkFile('./test/texts/repeat_words.txt', function(err, data) {
            setDebugMode(false);
            assert.equal(err, false);
            assert.equal(data.data.length, 2);
            done();
        }, {lang: 'ru', format: 'plain',  options: { findRepeatWords: true }});
    });

    it('checkFile markdown', function(done) {
        yaspeller.checkFile('./test/texts/repeat_words.md', function(err, data) {
            setDebugMode(false);
            assert.equal(err, false);
            assert.equal(data.data.length, 0);
            done();
        }, {
            lang: 'ru',
            ignoreTags: ['code'],
            options: { findRepeatWords: true }
        });
    });

    it('checkFile with window 1251', function(done) {
        yaspeller.checkFile('./test/texts/repeat_words_win1251.txt', function(err) {
            assert.equal(err, true);
            done();
        });
    });

    it('checkFile with unknown file', function(done) {
        yaspeller.checkFile('./test/texts/unknow.txt', function(err) {
            assert.equal(err, true);
            done();
        });
    });

    it('checkFile with dir', function(done) {
        yaspeller.checkFile('./test/texts/checkdir', function(err) {
            assert.equal(err, true);
            done();
        });
    });

    it('checkFile without settings', function(done) {
        yaspeller.checkFile('./test/texts/repeat_words.txt', function(err, data) {
            assert.equal(err, false);
            assert.equal(data.data.length, 2);
            done();
        });
    });

    it('checkUrl', function(done) {
        yaspeller.checkUrl(urlGH + 'repeat_words.txt', function(err, data) {
            assert.equal(err, false);
            assert.equal(data.data.length, 2);
            done();
        });
    });

    it('checkUrl 404', function(done) {
        yaspeller.checkUrl(url404, function(err) {
            assert.equal(err, true);
            done();
        });
    });

    it('checkUrl unknown host', function(done) {
        yaspeller.checkUrl(urlUnknown, function(err) {
            assert.equal(err, true);
            done();
        });
    });

    it('checkSitemap 404', function(done) {
        yaspeller.checkSitemap(urlGH + 'unknow_sitemap.xml', function(data) {
            assert.equal(data[0][0], true);
            done();
        });
    });

    it('checkSitemap', function(done) {
        yaspeller.checkSitemap(urlGH + 'sitemap.xml', function(data) {
            data.forEach(function(el) {
                assert.equal(el[0], false);
                assert.equal(el[1].data.length, 2);
            });
            done();
        });
    });

    it('checkSitemap incorrect', function(done) {
        yaspeller.checkSitemap(urlGH + 'incorrect_sitemap.xml', function(data) {
            assert.equal(data[0][0], true);
            done();
        });
    });

    it('checkSitemap unknown host', function(done) {
        yaspeller.checkSitemap(urlUnknown + 'sitemap.xml', function(data) {
            data.forEach(function(el) {
                assert.equal(el[0], true);
            });
            done();
        });
    });

    it('checkText', function(done) {
        const text = getFile('./test/texts/repeat_words.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 2);
            done();
        }, {lang: 'ru', format: 'plain', options: { findRepeatWords: true }});
    });

    it('checkText > 10000 bytes', function(done) {
        const text = getFile('./test/texts/gt10000bytes.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 2);
            done();
        }, {lang: 'ru', format: 'plain'});
    });

    it('checkText > 20000 bytes', function(done) {
        const text = getFile('./test/texts/gt20000bytes.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 3);
            done();
        }, {lang: 'ru', format: 'plain'});
    });

    it('ignore comments', function(done) {
        const text = getFile('./test/texts/settings_ignore_comments.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 2);
            done();
        }, {lang: 'en', format: 'html'});
    });

    it('addPositions', function() {
        const text = 'Moscaw London\nMoscow Londan';
        const data = [
            {word: 'Moscaw', count: 1},
            {word: 'Londan', count: 1}
        ];

        yaspeller.addPositions(text, data);

        assert.deepEqual(data, [
            {word: 'Moscaw', count: 1, position: [{line: 1, column: 1}]},
            {word: 'Londan', count: 1, position: [{line: 2, column: 8}]}
        ]);
    });

    it('removeDuplicates', function() {
        const data = [
            {word: 'asdkas9dka9sd', code: 2},
            {word: 'asdkas9dka9sd', code: 2},
            {word: 'Landon', s: ['London'], code: 1},
            {word: 'Landon', s: ['London'], code: 1}
        ];

        assert.deepEqual(yaspeller.removeDuplicates(data), [
            {word: 'Landon', suggest: ['London'], code: 1, count: 2},
            {word: 'asdkas9dka9sd', code: 2, count: 2}
        ]);
    });

    it('remove acute accent, shy and other', function(done) {
        const text = 'Helló, wórld!\nПриве́т, ми́р!\nRevo&shy;lu&shy;ti\u200con';

        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 0);
            done();
        }, {lang: 'ru,en', format: 'html'});
    });

    it('sortByPositions', function() {
        const data = [
            {word: 'Paaris', count: 3, position: [{line: 3, column: 1}], code: 3},
            {word: 'Mosca', count: 1, position: [{line: 7, column: 10}], code: 1},
            {word: 'Moscaw', count: 1, position: [{line: 6, column: 100}], code: 1},
            {word: 'Moscaww', count: 1, position: [{line: 6, column: 1}], code: 1},
            {word: 'Moscawwww', count: 1, position: [{line: 6, column: 10}], code: 1},
            {word: 'Moscawwwww', count: 1, position: [], code: 1},
            {word: 'Londannn', count: 1, position: [], code: 1},
            {word: 'Londan', count: 2, position: [{line: 2, column: 10}], code: 1},
            {word: 'Nev Yourk', count: 1, position: [{line: 1, column: 1}], code: 2}
        ];

        yaspeller.sortByPositions(data);

        assert.deepEqual(data, [
            {word: 'Londan', count: 2, position: [{line: 2, column: 10}], code: 1},
            {word: 'Moscaww', count: 1, position: [{line: 6, column: 1}], code: 1},
            {word: 'Moscawwww', count: 1, position: [{line: 6, column: 10}], code: 1},
            {word: 'Moscaw', count: 1, position: [{line: 6, column: 100}], code: 1},
            {word: 'Mosca', count: 1, position: [{line: 7, column: 10}], code: 1},
            {word: 'Londannn', count: 1, position: [], code: 1},
            {word: 'Moscawwwww', count: 1, position: [], code: 1},
            {word: 'Nev Yourk', count: 1, position: [{line: 1, column: 1}], code: 2},
            {word: 'Paaris', count: 3, position: [{line: 3, column: 1}], code: 3}
        ]);
    });
});
