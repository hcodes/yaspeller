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
    it('getConfig, custom config with comments', function() {
        assert.deepEqual(getConfig('./test/configs/comment.json'), {
            relativePath: 'test/configs/comment.json',
            data: { report: ['console'] }
        });
    });

    it('getConfig, default config', function() {
        const result = getConfig(null);
        assert.equal(result.relativePath, '.yaspellerrc');
        assert.ok(Object.keys(result.data).length);
    });

    it('getConfig, throw', function() {
        getConfig('test/configs/error_parsing.json');

        assert.equal(process.exit.args[0], exitCodes.ERROR_CONFIG);
    });

    it('getConfig, unknown properties', function() {
        getConfig('test/configs/unknown_properties.json');

        const count = console.error.args.length;
        assert.equal(count, 2);
    });

    it('getConfig, wrong property type', function() {
        getConfig('test/configs/wrong_prop_type.json');

        const count = console.error.args.length;
        assert.equal(count, 2);
    });

    it('getConfig from package.json', function() {
        process.chdir('./test/configs');
        assert.deepEqual(getConfig(null).data, { lang: 'en,ru' });
        process.chdir('../../');
    });

    it('getConfig from yaspellerrc.js', function() {
        process.chdir('./test/configs/rc.js');
        assert.deepEqual(getConfig(null).data, { report: ['rc.js'] });
        process.chdir('../../../');
    });

    it('getConfig from yaspellerrc.json', function() {
        process.chdir('./test/configs/json');
        assert.deepEqual(getConfig(null).data, { report: ['json'] });
        process.chdir('../../../');
    });

    it('getConfig from yaspellerrc', function() {
        process.chdir('./test/configs/rc');
        assert.deepEqual(getConfig(null).data, { report: ['rc'] });
        process.chdir('../../../');
    });
});
