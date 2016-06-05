var yaspeller = require('../lib/yaspeller'),
    dictionary = require('../lib/dictionary'),
    exitCodes = require('../lib/exit-codes'),
    assert = require('chai').assert;

describe('Dictionary', function() {
    it('removeDictWords(), strings', function() {
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

        dictionary._dict = dict;

        var result = dictionary.removeDictWords(typos);
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

    it('removeDictWords(), /RegExp/', function() {
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

        dictionary._dict = dict;

        var result = dictionary.removeDictWords(typos);
        assert.deepEqual(result, [
            {
                code: 1,
                word: 'блабла'
            }
        ]);
    });

    it('prepareDictionary()', function() {
        var dict = dictionary.prepareDictionary([
            'контрол',
            '/(Ю|юзабилити/',
            '/москв[а/i',
        ]);

        assert.equal(dict.length, 1);
    });

    it('prepareDictionary(), regExp', function() {
        var dict = dictionary.prepareDictionary([
            'контрол',
            'контрол2',
            '/unknowWord/',
            '/unknowWord2/',
            '/(Ю|юзабилити/',
            '/москв[а/i',
        ]);

        assert.equal(dict.length, 4);
    });

    it('isTypo()', function() {
        var dict = dictionary.prepareDictionary([
            'контрол'
        ]);

        assert.isFalse(dictionary.isTypo('Контрол', dict));

        var dict2 = dictionary.prepareDictionary([
            'Контрол'
        ]);

        assert.isTrue(dictionary.isTypo('контрол', dict2));
    });

    it('isTypo(), regExp', function() {
        var dict = dictionary.prepareDictionary([
            '/контрол/'
        ]);

        assert.isFalse(dictionary.isTypo('Контрол', dict));

        var dict2 = dictionary.prepareDictionary([
            '/Контрол/'
        ]);

        assert.isTrue(dictionary.isTypo('контрол', dict2));
    });

    it('removeDuplicates()', function() {
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

    it('getDictionary(), empty params', function() {
        dictionary.set();
        assert.deepEqual(dictionary._dict, []);
    });

    it('set(), dictionary from config', function() {
        dictionary.set([], ['a']);
        assert.deepEqual(dictionary._dict, [/[aA]/]);
    });

    it('set()', function() {
        dictionary.set(['test/dict/a.json', 'test/dict/b.json'], ['a']);
        assert.deepEqual(dictionary._dict, [
            /[aA]/,
            /[xX]yz/,
            /[aA]bc/,
            /CLI/,
            /[dD]eps/
        ]);
    });

    it('set(), is not utf8', function() {
        dictionary.set(['test/dict/not_utf8.json']);
        assert.equal(process.exit.args[0], exitCodes.ERROR_DICTIONARY);
    });

    it('set(), error parsing', function() {
        dictionary.set(['test/dict/error_parsing.json']);
        assert.equal(process.exit.args[0], exitCodes.ERROR_DICTIONARY);
    });

    it('set(), not exists', function() {
        dictionary.set(['test/dict/not_exists.json']);
        assert.equal(process.exit.args[0], exitCodes.ERROR_DICTIONARY);
    });

    it('isNotOptimizedRegExp()', function() {
        assert.isFalse(dictionary.isNotOptimizedRegExp('/Unknownword/'));
        assert.isTrue(dictionary.isNotOptimizedRegExp('/[U]nknownword/'));
        assert.isTrue(dictionary.isNotOptimizedRegExp('[U]nknownword'));

        assert.isTrue(dictionary.isNotOptimizedRegExp('/Unknownwor[d]/'));
        assert.isTrue(dictionary.isNotOptimizedRegExp('Unknownwor[d]'));

        assert.isTrue(dictionary.isNotOptimizedRegExp('/()Unknownword/'));
        assert.isTrue(dictionary.isNotOptimizedRegExp('()Unknownword'));

        assert.isTrue(dictionary.isNotOptimizedRegExp('/Unknownword()/'));
        assert.isTrue(dictionary.isNotOptimizedRegExp('Unknownword()'));

        assert.isTrue(dictionary.isNotOptimizedRegExp('/Unknow[]nword/'));
        assert.isTrue(dictionary.isNotOptimizedRegExp('Unknow[]nword'));

        assert.isFalse(dictionary.isNotOptimizedRegExp('/Unknow[ab]nword/'));
        assert.isFalse(dictionary.isNotOptimizedRegExp('Unknow[ab]nword'));

        assert.isTrue(dictionary.isNotOptimizedRegExp('/Unknow[a]nword/'));
        assert.isTrue(dictionary.isNotOptimizedRegExp('Unknow[a]nword'));

        assert.isTrue(dictionary.isNotOptimizedRegExp('/Unknow(a)nword/'));
        assert.isTrue(dictionary.isNotOptimizedRegExp('Unknow(a)nword'));
    });

    it('isUpperCase()', function() {
        assert.isFalse(dictionary.isUpperCase('а'));
        assert.isTrue(dictionary.isUpperCase('Р'));
    });

    it('isLowerCase()', function() {
        assert.isTrue(dictionary.isLowerCase('а'));
        assert.isFalse(dictionary.isLowerCase('Р'));
    });

    it('isLetter()', function() {
        assert.isFalse(dictionary.isLetter('='));
        assert.isFalse(dictionary.isLetter('-'));
        assert.isTrue(dictionary.isLetter('o'));
        assert.isTrue(dictionary.isLetter('P'));
    });
});
