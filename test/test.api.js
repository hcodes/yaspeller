const yaspeller = require('../lib/yaspeller');
const debug = require('../lib/debug');
const assert = require('chai').assert;
const fs = require('fs');
const url404 = 'https://raw.githubusercontent.com/asd9qi9e91ke9k2k193k19';
const urlUnknown = 'http://dk02keoqwke02keoqwwer923mr923.info/';
const urlGH = 'https://raw.githubusercontent.com/hcodes/yaspeller/master/test/texts/';
const getFile = name => fs.readFileSync(name).toString('utf-8');

debug.setDebug(true);

describe('API', function() {
    this.timeout(10000);

    it('checkFile', function(done) {
        yaspeller.checkFile('./test/texts/repeat_words.txt', function(err, data) {
            debug.setDebug(false);
            assert.equal(err, false);
            assert.equal(data.data.length, 2);
            done();
        }, {lang: 'ru', format: 'plain'});
    });

    it('checkFile with window 1251', function(done) {
        yaspeller.checkFile('./test/texts/repeat_words_win1251.txt', function(err) {
            assert.equal(err, true);
            done();
        });
    });

    it('checkFile with unknow file', function(done) {
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
        }, {lang: 'ru', format: 'plain'});
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
});
