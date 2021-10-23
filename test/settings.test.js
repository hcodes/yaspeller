const yaspeller = require('../lib/yaspeller');
const assert = require('chai').assert;
const fs = require('fs');
const getFile = name => {
    return fs.readFileSync(name).toString('utf-8');
};

describe('Settings', function() {
    this.timeout(10000);

    it('checkYo', function(done) {
        yaspeller.checkText('Елка, елки, еж.', function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 3);
            done();
        }, {lang: 'ru', checkYo: true});
    });

    it('ignoreTags off', function(done) {
        const text = getFile('./test/texts/settings_ignore_tags.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 4);
            done();
        }, {lang: 'en', format: 'html', ignoreTags: []});
    });

    it('ignoreTags on', function(done) {
        const text = getFile('./test/texts/settings_ignore_tags.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 1);
            done();
        }, {lang: 'en', format: 'html', ignoreTags: ['code']});
    });

    it('ignoreTags on, md', function(done) {
        const text = getFile('./test/texts/settings_ignore_tags.md');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 0);
            done();
        }, {lang: 'en', format: 'html', ignoreTags: ['code']});
    });

    it('Without lang and format', function(done) {
        yaspeller.checkText('<coddeeee> maasjedqjw  уфокцошцуок', function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 2);
            done();
        });
    });

    it('Array of langs', function(done) {
        const text = getFile('./test/texts/settings_array_langs.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 2);
            done();
        }, {lang: ['ru']});
    });

    it('Unknown format', function(done) {
        yaspeller.checkText('<coddeeee> maasjedqjw  уфокцошцуок', function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 3);
            done();
        }, {format: 'unknown'});
    });

    it('extname .htm', function(done) {
        yaspeller.checkText('&quot;Москва&quot;', function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 0);
            done();
        }, {extname: '.htm'});
    });

    it('Format markdown', function(done) {
        var text = getFile('./test/texts/settings_markdown.txt');
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 0);
            done();
        }, {ignoreTags: ['code', 'pre']});
    });
});
