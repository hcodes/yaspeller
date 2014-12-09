var yaspeller = require('../lib/yaspeller'),
    assert = require('chai').assert,
    fs = require('fs'),
    url404 = 'https://raw.githubusercontent.com/asd9qi9e91ke9k2k193k19',
    urlGH = 'https://raw.githubusercontent.com/hcodes/yaspeller/master/test/texts/';

describe('API', function() {
    it('checkFile', function(done) {
        yaspeller.checkFile('./test/texts/repeat_words.txt', function(err, data) {
            assert.equal(err, false);
            assert.equal(data.data.length, 2);
            done();
        }, {lang: 'ru', format: 'plain'});
    });

    it('checkFile with window 1251', function(done) {
        yaspeller.checkFile('./test/texts/repeat_words_win1251.txt', function(err, data) {
            assert.equal(err, true);
            done();
        });
    });

    it('checkFile with unknow file', function(done) {
        yaspeller.checkFile('./test/texts/unknow.txt', function(err, data) {
            assert.equal(err, true);
            done();
        });
    });

    it('checkFile with dir', function(done) {
        yaspeller.checkFile('./test/texts/checkdir', function(err, data) {
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

    yaspeller.setParams({
        fileExtensions: ['txt']
    });

    it('checkDir', function(done) {
        yaspeller.checkDir('./test/texts/checkdir', function(data) {
            data.forEach(function(el) {
                assert.equal(el[0], false);
                assert.equal(el[1].data.length, 2);
            });
            done();
        });
    });

    it('checkDir with unknow dir', function(done) {
        yaspeller.checkDir('./test/texts/unknowndir', function(data) {
            data.forEach(function(el) {
                assert.equal(el[0], true);
            });
            done();
        });
    });

    it('checkDir as file', function(done) {
        yaspeller.checkDir('./test/texts/repeat_words.txt', function(data) {
            data.forEach(function(el) {
                assert.equal(el[0], false);
                assert.equal(el[1].data.length, 2);
            });
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
        yaspeller.checkUrl(url404, function(err, data) {
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

    it('checkSitemap incorrect', function(done) {
        yaspeller.checkSitemap(urlGH + 'incorrect_sitemap.xml', function(data) {
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

    it('checkText', function(done) {
        var text = fs.readFileSync('./test/texts/repeat_words.txt').toString('utf-8');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 2);
            done();
        }, {lang: 'ru', format: 'plain'});
    });
});
