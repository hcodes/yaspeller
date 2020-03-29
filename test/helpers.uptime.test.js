const assert = require('chai').assert;
const { uptime } = require('../lib/helpers/uptime');

describe('Uptime', () => {
    it('uptime', () => {
        assert.equal(typeof uptime(), 'string');
    });
});
