const dictionary = require('../lib/dictionary');
const exitCodes = require('../lib/exit-codes');
const assert = require('chai').assert;

describe('Dictionary', function() {
    it('removeDictionaryWordsFromData(), strings', function() {
        const typos = [
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

        dictionary.set([
            'контрол',
            'юзабилити'
        ]);

        assert.deepEqual(dictionary.removeDictionaryWordsFromData(typos), [
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

    it('prepareDictionaryWords()', function() {
        const dict = dictionary.prepareDictionaryWords([
            'контрол',
            '/(Ю|юзабилити/',
            '/москв[а/i',
        ]);

        assert.equal(dict.length, 1);
    });

    it('isTypo()', function() {
        [
            {
                dict: [
                    'контрол'
                ],
                word: 'Контрол',
                result: false
            },
            {
                dict: [
                    'Контрол'
                ],
                word: 'контрол',
                result: true
            },
            {
                dict: [
                    'митап'
                ],
                word: 'митап',
                result: false
            },
            {
                dict: [
                    'митап'
                ],
                word: 'тестмитап',
                result: true
            },
            {
                dict: [
                    'митап'
                ],
                word: 'немитап',
                result: true
            },
            {
                dict: [
                    'митап'
                ],
                word: 'багмитапбаг',
                result: true
            }
        ].forEach(item => {
            const dict = dictionary.prepareDictionaryWords(item.dict);
            assert.equal(item.result, dictionary.isTypo(item.word, dict), item.word);
        });
    });

    it('getDictionary(), empty params', function() {
        dictionary.loadDictionaries();
        assert.deepEqual(dictionary.get(), []);
    });

    it('set(), dictionary from config', function() {
        dictionary.loadDictionaries([], ['a']);
        assert.deepEqual(dictionary.get(), [/^[aA]$/]);
    });

    it('set()', function() {
        dictionary.loadDictionaries(['test/dict/a.json', 'test/dict/b.json'], ['a']);
        assert.deepEqual(dictionary.get(), [
            /^[aA]$/,
            /^[xX]yz$/,
            /^[aA]bc$/,
            /^CLI$/,
            /^[dD]eps$/
        ]);
    });

    it('set(), is not utf8', function() {
        dictionary.loadDictionaries(['test/dict/not_utf8.json']);
        assert.equal(process.exit.args[0], exitCodes.ERROR_DICTIONARY);
    });

    it('set(), error parsing', function() {
        dictionary.loadDictionaries(['test/dict/error_parsing.json']);
        assert.equal(process.exit.args[0], exitCodes.ERROR_DICTIONARY);
    });

    it('set(), not exists', function() {
        dictionary.loadDictionaries(['test/dict/not_exists.json']);
        assert.equal(process.exit.args[0], exitCodes.ERROR_DICTIONARY);
    });

    it('isNotOptimizedRegExp()', function() {
        assert.isFalse(dictionary.isNotOptimizedRegExp('/Unknownword/'));
        assert.isTrue(dictionary.isNotOptimizedRegExp('[U]nknownword'));

        assert.isTrue(dictionary.isNotOptimizedRegExp('Unknownwor[d]'));

        assert.isTrue(dictionary.isNotOptimizedRegExp('()Unknownword'));

        assert.isTrue(dictionary.isNotOptimizedRegExp('Unknownword()'));

        assert.isTrue(dictionary.isNotOptimizedRegExp('Unknow[]nword'));

        assert.isFalse(dictionary.isNotOptimizedRegExp('Unknow[ab]nword'));

        assert.isTrue(dictionary.isNotOptimizedRegExp('Unknow[a]nword'));

        assert.isTrue(dictionary.isNotOptimizedRegExp('Unknow(a)nword'));
    });
});
