const assert = require('chai').assert;
const sinon = require('sinon');
const config = require('../lib/config');
const exitCodes = require('../lib/exit-codes');

beforeEach(function() {
    sinon.stub(process, 'exit');
});

afterEach(function() {
    process.exit.restore();
});

describe('Config', function() {
    it('get, custom config', function() {
        assert.deepEqual(config.get('./test/json/no_comment.json'), ['1']);
    });

    it('get, default config', function() {
        assert.ok(Object.keys(config.get(null)).length);
    });

    it('get, throw', function() {
        config.get('test/json/error_parsing.json');
        assert.equal(process.exit.args[0], exitCodes.ERROR_CONFIG);
    });
});
