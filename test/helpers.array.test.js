const assert = require('chai').assert;
const { uniq } = require('../lib/helpers/array');

describe('Array', () => {
    it('uniq', () => {
        assert.deepEqual(
            uniq([1, 1, 2, 2, 3, 4, 5, 5]),
            [1, 2, 3, 4, 5]
        );
    });
});
