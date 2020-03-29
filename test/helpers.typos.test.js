const assert = require('chai').assert;
const { hasManyErrors, getTyposByCode } = require('../lib/helpers/typos');

describe('Typos', () => {
    it('hasManyErrors', () => {
        assert.ok(hasManyErrors([{code: 4}, {code: 1}]));
        assert.notOk(hasManyErrors([{code: 1}]));
    });

    it('getTyposByCode', () => {
        assert.deepEqual(getTyposByCode(1, [{code: 1}, {code: 2}, {code: 4}]), [{code: 1}]);
    });
});
