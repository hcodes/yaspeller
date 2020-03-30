const assert = require('chai').assert;

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { getConfig } = require('../lib/config');
const exitCodes = require('../lib/exit-codes');

beforeEach(function() {
    sandbox.stub(process, 'exit');
    sandbox.spy(console, 'error');
});

afterEach(function() {
    sandbox.restore();
});

describe('Config', function() {
    it('get, custom config', function() {
        assert.deepEqual(getConfig('./test/json/no_comment.json'), {
            relativePath: 'test/json/no_comment.json',
            data: ['1']
        });
    });
    
    it('get, custom config with comments', function() {
        assert.deepEqual(getConfig('./test/json/comment.json'), {
            relativePath: 'test/json/comment.json',
            data: ['1']
        });
    });

    it('get, default config', function() {
        const result = getConfig(null);
        assert.equal(result.relativePath, '.yaspellerrc');
        assert.ok(Object.keys(result.data).length);
    });

    it('get, throw', function() {
        getConfig('test/json/error_parsing.json');

        assert.equal(process.exit.args[0], exitCodes.ERROR_CONFIG);
    });

    it('get, unknown properties', function() {
        getConfig('test/json/unknown_properties.json');

        const count = console.error.args.length;
        assert.equal(count, 2);
    });

    it('get, wrong property type', function() {
        getConfig('test/json/wrong_prop_type.json');

        const count = console.error.args.length;
        assert.equal(count, 2);
    });

    it('get, config from package.json', function() {
        process.chdir('./test/json');
        assert.deepEqual(getConfig(null).data, { lang: 'en,ru' });
        process.chdir('../../');
    });
});
