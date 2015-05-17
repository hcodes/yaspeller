var yaspeller = require('../lib/yaspeller'),
    dictionary = require('../lib/dictionary'),
    exitCodes = require('../lib/exit-codes'),
    assert = require('chai').assert;

describe('Dictionary', function() {
    it('removeDictWords, strings', function() {
        var dict = dictionary.prepareDictionary([
                'контрол',
                'юзабилити'
            ]),
            typos = [
                {
                    code: 1,
                    word: 'юзабилити'
                },
                {
                    code: 2,
                    word: 'москва'
                },
                {
                    code: 1,
                    word: 'блабла'
                },
                {
                    code: 1,
                    word: 'контрол'
                }
            ];

        var result = dictionary.removeDictWords(typos, dict);
        assert.deepEqual(result, [
            {
                code: 2,
                word: 'москва'
            },
            {
                code: 1,
                word: 'блабла'
            }
        ]);
    });

    it('removeDictWords, /RegExp/', function() {
        var dict = dictionary.prepareDictionary([
                'контрол',
                '/(Ю|ю)забилити/',
                '/москва/i',
            ]),
            typos = [
                {
                    code: 1,
                    word: 'Юзабилити'
                },
                {
                    code: 1,
                    word: 'юзабилити'
                },
                {
                    code: 1,
                    word: 'мосКва'
                },
                {
                    code: 1,
                    word: 'блабла'
                },
                {
                    code: 1,
                    word: 'контрол'
                }
            ];

        var result = dictionary.removeDictWords(typos, dict);
        assert.deepEqual(result, [
            {
                code: 1,
                word: 'блабла'
            }
        ]);
    });

    it('removeDuplicates', function() {
        var dict = dictionary.prepareDictionary([
            'контрол',
            '/(Ю|юзабилити/',
            '/москв[а/i',
        ]);

        assert.equal(dict.length, 1);
    });

    it('prepareDictionary', function() {
        var typos = [
                {
                    code: 1,
                    word: 'юзабилити'
                },
                {
                    code: 1,
                    word: 'юзабилити'
                },
                {
                    code: 1,
                    word: 'мосКва'
                },
                {
                    code: 1,
                    word: 'мосКва'
                },
                {
                    code: 1,
                    word: 'блабла'
                }
            ];

        var result = yaspeller.removeDuplicates(typos);
        assert.equal(result.length, 3);
    });
    
    it('getDictionary, empty params', function() {
        var result = dictionary.getDictionary();
        assert.deepEqual(result, []);
    });
    
    it('getDictionary, dictionary from config', function() {
        var result = dictionary.getDictionary([], ['a']);
        assert.deepEqual(result, ['a']);
    });
    
    it('getDictionary', function() {
        var result = dictionary.getDictionary(['test/dict/a.json', 'test/dict/b.json'], ['a']);
        assert.deepEqual(result, ['a', 'xyz', 'abc', 'CLI', 'deps']);
    });
    
    it('getDictionary, is not utf8', function() {
        dictionary.getDictionary(['test/dict/not_utf8.json']);
        assert.equal(process.exit.args[0], exitCodes.ERROR_DICTIONARY);
    });

    it('getDictionary, error parsing', function() {
        dictionary.getDictionary(['test/dict/error_parsing.json']);
        assert.equal(process.exit.args[0], exitCodes.ERROR_DICTIONARY);
    });

    it('getDictionary, not exists', function() {
        dictionary.getDictionary(['test/dict/not_exists.json']);
        assert.equal(process.exit.args[0], exitCodes.ERROR_DICTIONARY);
    });
});
