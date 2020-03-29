const assert = require('chai').assert;
const {
    kebabCase,
    replaceEngLettersWithAsterisk,
    replaceRusLettersWithAsterisk,
    hasEngRusLetters,
    stripTags,
} = require('../lib/helpers/string'); 

describe('String', () => {
    it('kebabCase', () => {
        assert.equal(
            kebabCase('helloWorld'),
            'hello-world'
        );
    });

    it('replaceEngLettersWithAsterisk', () => {
        assert.equal(replaceEngLettersWithAsterisk('abcабв'), '***абв');
    });

    it('replaceRusLettersWithAsterisk', () => {
        assert.equal(replaceRusLettersWithAsterisk('abcабв'), 'abc***');
    });

    it('hasEngRusLetters', () => {
        assert.notOk(hasEngRusLetters('122903_+.,'));
        assert.notOk(hasEngRusLetters('фтлуцщклщ1930123'));
        assert.ok(hasEngRusLetters('asmdi3qwуьык023кь'));
    });

    it('stripTags', () => {
        assert.ok(stripTags('<p>Hello</p>', 'Hello'));
    });
});
