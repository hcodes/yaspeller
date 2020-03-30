const assert = require('chai').assert;

const { packageJson } = require('../lib/helpers/package');

describe('Package', () => {
    it('packageJson', () => {
        assert.equal(typeof packageJson.version, 'string');
    }); 
});
