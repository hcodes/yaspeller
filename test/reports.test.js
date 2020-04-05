const assert = require('chai').assert;
const reports = require('../lib/reports');

describe('Reports', () => {
    it('should set default report', () => {
        reports.set();

        assert.equal(reports.reports.length, 1);
        assert.equal(reports.reports[0].name, 'console');
    });

    it('should set inner reports', () => {
        reports.set('console,html');

        assert.equal(reports.reports.length, 2);
        assert.equal(reports.reports[0].name, 'console');
        assert.equal(reports.reports[1].name, 'html');

    });

    it('should set inner reports as array of strings', () => {
        reports.set(['console', 'html']);

        assert.equal(reports.reports.length, 2);
        assert.equal(reports.reports[0].name, 'console');
        assert.equal(reports.reports[1].name, 'html');
    });

    it('should set internal and external report', () => {
        reports.set(['console', './test/reports/example']);

        assert.equal(reports.reports.length, 2);
        assert.equal(reports.reports[0].name, 'console');
        assert.equal(reports.reports[1].name, 'example');
    });

    it('should set internal and unknown external report', () => {
        reports.set(['console', './test/reports/example_unknown']);

        assert.equal(reports.reports.length, 1);
        assert.equal(reports.reports[0].name, 'console');
    });

    it('should not set external report without name property', () => {
        reports.set(['./test/reports/without_name']);

        assert.equal(reports.reports.length, 0);
    });

    it('should not set external report without methods', () => {
        reports.set(['./test/reports/without_methods']);

        assert.equal(reports.reports.length, 0);
    });
});
