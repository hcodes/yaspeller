var yaspeller = require('../lib/yaspeller'),
    debug = require('../lib/debug'),
    assert = require('chai').assert,
    fs = require('fs'),
    getFile = function(name) {
        return fs.readFileSync(name).toString('utf-8');
    };

debug.setDebug(true);

describe('Options', function() {
    this.timeout(10000);

    it('ignoreUppercase on', function(done) {
        var text = getFile('./test/texts/ignore_uppercase.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 0);
            done();
        }, {lang: 'ru', format: 'plain', options: {ignoreUppercase: true}});
    });

    it('ignoreUppercase off', function(done) {
        var text = getFile('./test/texts/ignore_uppercase.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 1);
            done();
        }, {lang: 'ru', format: 'plain'});
    });

    it('ignoreDigits on', function(done) {
        var text = getFile('./test/texts/ignore_digits.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 0);
            done();
        }, {lang: 'ru', format: 'plain', options: {ignoreDigits: true}});
    });

    it('ignoreDigits off', function(done) {
        var text = getFile('./test/texts/ignore_digits.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 1);
            done();
        }, {lang: 'ru', format: 'plain'});
    });

    it('ignoreLatin on', function(done) {
        var text = getFile('./test/texts/ignore_latin.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 0);
            done();
        }, {lang: 'en,ru', format: 'plain', options: {ignoreLatin: true}});
    });

    it('ignoreLatin off', function(done) {
        var text = getFile('./test/texts/ignore_latin.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 1);
            done();
        }, {lang: 'en,ru', format: 'plain'});
    });

    it('ignoreUrls on', function(done) {
        var text = getFile('./test/texts/ignore_urls.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 0);
            done();
        }, {lang: 'en,ru', format: 'plain', options: {ignoreUrls: true}});
    });

    it('ignoreUrls off', function(done) {
        var text = getFile('./test/texts/ignore_urls.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 2);
            done();
        }, {lang: 'en,ru', format: 'plain'});
    });

    it('ignoreCapitalization on', function(done) {
        var text = getFile('./test/texts/ignore_capitalization.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 0);
            done();
        }, {lang: 'ru', format: 'plain', options: {ignoreCapitalization: true}});
    });

    it('ignoreCapitalization off', function(done) {
        var text = getFile('./test/texts/ignore_capitalization.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 1);
            done();
        }, {lang: 'ru', format: 'plain'});
    });

    it('findRepeatWords on', function(done) {
        var text = getFile('./test/texts/find_repeat_words.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 1);
            done();
        }, {lang: 'ru', format: 'plain', options: {findRepeatWords: true}});
    });

    it('findRepeatWords off', function(done) {
        var text = getFile('./test/texts/find_repeat_words.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 0);
            done();
        }, {lang: 'ru', format: 'plain'});
    });

    it('ignoreRomanNumerals on', function(done) {
        var text = getFile('./test/texts/ignore_roman_numerals.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 0);
            done();
        }, {lang: 'en,ru', format: 'plain', options: {ignoreRomanNumerals: true}});
    });

    it('ignoreRomanNumerals off', function(done) {
        var text = getFile('./test/texts/ignore_roman_numerals.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 1);
            done();
        }, {lang: 'en,ru', format: 'plain'});
    });

    it('flagLatin on', function(done) {
        var text = getFile('./test/texts/flag_latin.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 1);
            done();
        }, {lang: 'ru', format: 'plain', options: {flagLatin: true}});
    });

    it('flagLatin off', function(done) {
        var text = getFile('./test/texts/flag_latin.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 0);
            done();
        }, {lang: 'ru', format: 'plain'});
    });
});
