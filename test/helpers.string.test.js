const assert = require('chai').assert;
const {
    kebabCase,
    isHTML,
    isMarkdown,
    jsonStringify,
    replaceEngLettersWithAsterisk,
    replaceRusLettersWithAsterisk,
    hasEngRusLetters,
    splitTrim,
    splitByCommas,
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

    it('isHTML', () => {
        assert.ok(isHTML('<p>Hello</p>'));
        assert.notOk(isHTML('Hello world'));
    });

    it('isMarkdown', () => {
        assert.ok(isMarkdown('```code```'));
        assert.notOk(isMarkdown('Hello world'));
    });

    it('jsonStringify', () => {
        assert.equal(jsonStringify({ a: 1, b: 2 }), '{\n  "a": 1,\n  "b": 2\n}');
    });

    it('isMarkdown', () => {
        assert.ok(isMarkdown('```code```'));
        assert.notOk(isMarkdown('Hello world'));
    });

    it('splitTrim', () => {
        assert.deepEqual(splitTrim(' 1:2 ', ':'), ['1', '2']);
    });

    it('splitByComma', () => {
        assert.deepEqual(splitByCommas('console , html '), ['console', 'html']);
    });

});
