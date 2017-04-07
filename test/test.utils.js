const assert = require('chai').assert;
const sinon = require('sinon');
const pth = require('path');
const exitCodes = require('../lib/exit-codes');
const utils = require('../lib/utils');

beforeEach(function() {
    sinon.stub(process, 'exit');
});

afterEach(function() {
    process.exit.restore();
});

describe('Utils', function() {
    it('isSitemap', function() {
        assert.ok(utils.isSitemap('http://example.org/sitemap.xml'));
        assert.notOk(utils.isSitemap('http://example.org/about'));
    });

    it('isUrl', function() {
        assert.ok(utils.isUrl('http://example.org'));
        assert.ok(utils.isUrl('https://example.org'));
        assert.notOk(utils.isSitemap('example.org'));
    });

    it('replaceEn', function() {
        assert.equal(utils.replaceEn('abcабв'), '***абв');
    });

    it('replaceRu', function() {
        assert.equal(utils.replaceRu('abcабв'), 'abc***');
    });

    it('hasEnRu', function() {
        assert.notOk(utils.hasEnRu('122903_+.,'));
        assert.notOk(utils.hasEnRu('фтлуцщклщ1930123'));
        assert.ok(utils.hasEnRu('asmdi3qwуьык023кь'));
    });

    it('isReqFileExtension', function() {
        assert.ok(utils.isReqFileExtension('example.js', []));
        assert.ok(utils.isReqFileExtension('example.js', ['']));
        assert.ok(utils.isReqFileExtension('example.js', ['.js']));
        assert.ok(utils.isReqFileExtension('example.ru.js', ['.en.js', '', '.ru.js']));

        assert.notOk(utils.isReqFileExtension('example.js', ['', '.css']));
        assert.notOk(utils.isReqFileExtension('example.js', ['.css']));
        assert.notOk(utils.isReqFileExtension('example.js', ['.css', '.en.js', '.ru.js']));
    });

    it('isExcludedFile', function() {
        assert.ok(utils.isExcludedFile(pth.resolve('./README.md'), ['README.md']));
        assert.notOk(utils.isExcludedFile(pth.resolve('example.js'), ['*.css']));
    });

    it('isDir', function() {
        assert.ok(utils.isDir('./test'));
        assert.notOk(utils.isDir('./README.md'));
    });

    it('hasManyErrors', function() {
        assert.ok(utils.hasManyErrors([{code: 4}, {code: 1}]));
        assert.notOk(utils.hasManyErrors([{code: 1}]));
    });

    it('uptime', function() {
        assert.equal(typeof utils.uptime(), 'string');
    });

    it('getTyposByCode', function() {
        assert.deepEqual(utils.getTyposByCode(1, [{code: 1}, {code: 2}, {code: 4}]), [{code: 1}]);
    });

    it('findFiles', function() {
        assert.deepEqual(
            utils.findFiles('./test/find/', ['.js'], ['**/*/ignore.js']).sort(),
            [
                pth.resolve('./test/find/1.js'),
                pth.resolve('./test/find/2.js'),
                pth.resolve('./test/find/dir/3.js'),
                pth.resolve('./test/find/dir/4.js')
            ].sort()
        );
    });

    it('loadFileAsJson', function() {
        assert.deepEqual(
            utils.loadFileAsJson('./test/json/comment.json'),
            ['1']
        );

        assert.deepEqual(
            utils.loadFileAsJson('./test/json/no_comment.json'),
            ['1']
        );
    });

    it('loadFileAsJson, not json', function() {
        assert.throws(function() {
            utils.loadFileAsJson('./test/json/comment.ojs');
        });
    });

    it('loadFileAsJson, js', function() {
        assert.deepEqual(
            utils.loadFileAsJson('./test/json/comment.js'),
            ['1']
        );
    });

    it('loadFileAsJson, unknown file', function() {
        assert.throws(function() {
            utils.loadFileAsJson('unknown_file', true);
        });
    });

    it('loadFileAsJson, not utf8', function() {
        assert.throws(function() {
            utils.loadFileAsJson('test/json/not_utf8.json');
        });
    });

    it('loadFileAsJson, error parsing', function() {
        assert.throws(function() {
            utils.loadFileAsJson('test/json/error_parsing.json');
        });
    });

    it('getConfig, custom config', function() {
        assert.deepEqual(utils.getConfig('./test/json/no_comment.json'), ['1']);
    });

    it('getConfig, default config', function() {
        assert.ok(Object.keys(utils.getConfig(null)).length);
    });

    it('getConfig, throw', function() {
        utils.getConfig('test/json/error_parsing.json');
        assert.equal(process.exit.args[0], exitCodes.ERROR_CONFIG);
    });

    it('kebabCase', function() {
        assert.equal(
            utils.kebabCase('helloWorld'),
            'hello-world'
        );
    });

    it('uniq', function() {
        assert.deepEqual(
            utils.uniq([1, 1, 2, 2, 3, 4, 5, 5]),
            [1, 2, 3, 4, 5]
        );
    });
});
