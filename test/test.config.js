const assert = require('chai').assert;
const fs = require('fs');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const config = require('../lib/config');
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
        assert.deepEqual(config.get('./test/json/no_comment.json'), ['1']);
    });

    it('get, default config', function() {
        assert.ok(Object.keys(config.get(null)).length);
    });

    it('get, throw', function() {
        config.get('test/json/error_parsing.json');
        assert.equal(process.exit.args[0], exitCodes.ERROR_CONFIG);
    });

    it('get, unknown properties', function() {
        config.get('test/json/unknown_properties.json');
        
        const count = console.error.args.length;
        assert.equal(count, 2);
    });

    it('get, wrong property type', function() {        
        config.get('test/json/wrong_prop_type.json');

        const count = console.error.args.length;
        assert.equal(count, 2);
    });

    it('get, package.json', function() {
        fs.renameSync('./package.json', './package.json.tmp');
        const writeStream = fs.createWriteStream('./package.json');
        fs.createReadStream('./test/json/test_package.json').pipe(writeStream);
        writeStream.on('close', () => {
            const data = config.get();
            fs.unlinkSync('./package.json');
            fs.renameSync('./package.json.tmp', './package.json');
            assert.deepEqual(data, { lang: 'tlh' });
        });
    });
});
