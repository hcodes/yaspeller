const assert = require('chai').assert;
const pth = require('path');
const {
    isExcludedFile,
    isDirectory,
    isRequiredFileExtension,
    findFiles,
    loadFileAsJson,
} = require('../lib/helpers/file');

describe('File', () => {
    it('isRequiredFileExtension', () => {
        assert.ok(isRequiredFileExtension('example.js', []));
        assert.ok(isRequiredFileExtension('example.js', ['']));
        assert.ok(isRequiredFileExtension('example.js', ['.js']));
        assert.ok(isRequiredFileExtension('example.ru.js', ['.en.js', '', '.ru.js']));

        assert.notOk(isRequiredFileExtension('example.js', ['', '.css']));
        assert.notOk(isRequiredFileExtension('example.js', ['.css']));
        assert.notOk(isRequiredFileExtension('example.js', ['.css', '.en.js', '.ru.js']));
    });

    it('isExcludedFile', () => {
        assert.ok(isExcludedFile(pth.resolve('./README.md'), ['README.md']));
        assert.notOk(isExcludedFile(pth.resolve('example.js'), ['*.css']));
    });

    it('isDirectory', () => {
        assert.ok(isDirectory('./test'));
        assert.notOk(isDirectory('./README.md'));
    });

    it('findFiles', () => {
        assert.deepEqual(
            findFiles('./test/find/', ['.js'], ['**/*/ignore.js']).sort(),
            [
                pth.resolve('./test/find/1.js'),
                pth.resolve('./test/find/2.js'),
                pth.resolve('./test/find/dir/3.js'),
                pth.resolve('./test/find/dir/4.js')
            ].sort()
        );
    });

    it('loadFileAsJson', () => {
        assert.deepEqual(
            loadFileAsJson('./test/json/comment.json'),
            ['1']
        );

        assert.deepEqual(
            loadFileAsJson('./test/json/no_comment.json'),
            ['1']
        );
    });

    it('loadFileAsJson, not json', () => {
        assert.throws(() => {
            loadFileAsJson('./test/json/comment.ojs');
        });
    });

    it('loadFileAsJson, js', () => {
        assert.deepEqual(
            loadFileAsJson('./test/json/comment.js'),
            ['1']
        );
    });

    it('loadFileAsJson, unknown file', () => {
        assert.throws(() => {
            loadFileAsJson('unknown_file', true);
        });
    });

    it('loadFileAsJson, not utf8', () => {
        assert.throws(() => {
            loadFileAsJson('test/json/not_utf8.json');
        });
    });

    it('loadFileAsJson, error parsing', () => {
        assert.throws(() => {
            loadFileAsJson('test/json/error_parsing.json');
        });
    });
});
