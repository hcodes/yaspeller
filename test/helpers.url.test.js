const assert = require('chai').assert;
const { isUrl, isSitemap } = require('../lib/helpers/url');

describe('Url', () => {
    it('isSitemap', () => {
        assert.ok(isSitemap('http://example.org/sitemap.xml'));
        assert.notOk(isSitemap('http://example.org/about'));
    });

    it('isUrl', () => {
        assert.ok(isUrl('http://example.org'));
        assert.ok(isUrl('https://example.org'));
        assert.notOk(isUrl('example.org'));
    });
});
