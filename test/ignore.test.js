const yaspeller = require('../lib/yaspeller');
const { prepareRegExpToIgnoreText } = require('../lib/helpers/ignore');
const assert = require('chai').assert;

describe('Ignore text', () => {
    it('by lines with //', done => {
        const text = 'Масква // yaspeller ignore\n Москва Масква // yaspeller ignore\nМасква //yaspeller  ignore     \n Москва Масква // yaspeller ignore\nМасква';
        yaspeller.checkText(text, (err, data) => {
            assert.equal(err, false);
            assert.equal(data.length, 1);
            done();
        }, {lang: 'ru'});
    });

    it('by lines with /*', done => {
        const text = 'Масква /* yaspeller ignore */ \n Москва Масква /*yaspeller ignore*/\nМасква /* yaspeller  ignore     */\n Москва Масква // yaspeller ignore\nМасква';
        yaspeller.checkText(text, (err, data) => {
            assert.equal(err, false);
            assert.equal(data.length, 1);
            done();
        }, {lang: 'ru'});
    });

    it('by lines with <!--', done => {
        const text = 'Масква\nМасква <!-- yaspeller ignore -->\n Москва Масква <!--yaspeller ignore\nМасква <!--yaspeller  ignore     -->\n Москва Масква <!--      yaspeller ignore      -->\nМасква';
        yaspeller.checkText(text, (err, data) => {
            assert.equal(err, false);
            assert.equal(data.length, 2);
            done();
        }, {lang: 'ru'});
    });
    
    it('by blocks with //', done => {
        const text = 'Масква // yaspeller ignore:start \n Москва Масква \nМасква \n Москва Масква // yaspeller ignore:end ';
        yaspeller.checkText(text, (err, data) => {
            assert.equal(err, false);
            assert.equal(data.length, 1);
            done();
        }, {lang: 'ru'});
    });

    it('by blocks with /*', done => {
        const text = 'Масква /* yaspeller ignore:start */ \n Москва Масква \n Масква /* yaspeller  ignore:end  */\n Москва Масква';
        yaspeller.checkText(text, (err, data) => {
            assert.equal(err, false);
            assert.equal(data.length, 2);
            done();
        }, {lang: 'ru'});
    });

    it('by blocks with <!--', function(done) {
        const text = 'Масква\nМасква <!-- yaspeller ignore:start -->\n Москва Масква <!--yaspeller ignore:end -->\nМасква <!--yaspeller  ignore:start -->\n Москва Масква <!--      yaspeller ignore:end -->\nМасква';
        yaspeller.checkText(text, (err, data) => {
            assert.equal(err, false);
            assert.equal(data.length, 4);
            done();
        }, {lang: 'ru'});
    });
    
    it('with regExp, long', done => {
        const text = 'Moscaw1\n<ignore>Moscaw2</ignore>\n<ignore>Moscaw3</ignore>\nMoscaw4';
        yaspeller.checkText(text, (err, data) => {
            assert.equal(data.length, 2);
            done();
        }, {
            lang: 'en',
            ignoreText: prepareRegExpToIgnoreText([
                ['<ignore>[^]*?</ignore>', 'gi']
            ])
        });
    });

    it('with regExp, short1', done => {
        const text = 'Moscaw1\n<ignore>Moscaw2</ignore>\n<ignore>Moscaw3</ignore>\nMoscaw4';
        yaspeller.checkText(text, (err, data) => {
            assert.equal(data.length, 2);
            done();
        }, {
            lang: 'en',
            ignoreText: prepareRegExpToIgnoreText(['<ignore>[^]*?</ignore>'])
        });
    });

    it('with regExp, short2', done => {
        const text = 'Moscaw1\n<ignore>Moscaw2</ignore>\n<ignore>Moscaw3</ignore>\nMoscaw4';
        yaspeller.checkText(text, (err, data) => {
            assert.equal(data.length, 2);
            done();
        }, {
            lang: 'en',
            ignoreText: prepareRegExpToIgnoreText('<ignore>[^]*?</ignore>')
        });
    });
});
