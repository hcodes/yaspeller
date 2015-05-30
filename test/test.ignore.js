// jshint maxlen:1024
var yaspeller = require('../lib/yaspeller'),
    assert = require('chai').assert;

describe('Ignore text', function() {
    it('by lines with //', function(done) {
        var text = 'Масква // yaspeller ignore\n Москва Масква // yaspeller ignore\nМасква //yaspeller  ignore     \n Москва Масква // yaspeller ignore\nМасква';
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 1);
            done();
        }, {lang: 'ru'});
    });

    it('by lines with /*', function(done) {
        var text = 'Масква /* yaspeller ignore */ \n Москва Масква /*yaspeller ignore*/\nМасква /* yaspeller  ignore     */\n Москва Масква // yaspeller ignore\nМасква';
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 1);
            done();
        }, {lang: 'ru'});
    });

    it('by lines with <!--', function(done) {
        var text = 'Масква\nМасква <!-- yaspeller ignore -->\n Москва Масква <!--yaspeller ignore\nМасква <!--yaspeller  ignore     -->\n Москва Масква <!--      yaspeller ignore      -->\nМасква';
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 2);
            done();
        }, {lang: 'ru'});
    });
    
    it('by blocks with //', function(done) {
        var text = 'Масква // yaspeller ignore:start \n Москва Масква \nМасква \n Москва Масква // yaspeller ignore:end ';
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 1);
            done();
        }, {lang: 'ru'});
    });

    it('by blocks with /*', function(done) {
        var text = 'Масква /* yaspeller ignore:start */ \n Москва Масква \n Масква /* yaspeller  ignore:end  */\n Москва Масква';
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 2);
            done();
        }, {lang: 'ru'});
    });

    it('by blocks with <!--', function(done) {
        var text = 'Масква\nМасква <!-- yaspeller ignore:start -->\n Москва Масква <!--yaspeller ignore:end -->\nМасква <!--yaspeller  ignore:start -->\n Москва Масква <!--      yaspeller ignore:end -->\nМасква';
        yaspeller.checkText(text, function(err, data) {
            assert.equal(err, false);
            assert.equal(data.length, 4);
            done();
        }, {lang: 'ru'});
    });
});
