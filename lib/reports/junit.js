'use strict';

const fs = require('fs');
const { consoleError, consoleInfo } = require('../helpers/console');
const filename = 'yaspeller_report.junit.xml';
/**
 * @param {number} ms
 * @returns {number}
 */
const msToSec = (ms) => ms / 1000;

module.exports = {
    name: 'junit',
    onComplete(data) {
        try {
            const header = '<?xml version="1.0" encoding="UTF-8"?>\n<testsuites><testsuite name="speller" time="">\n';
            const footer = '\n</testsuite></testsuites>';
            const items = data.map(([, item]) => {
                const errors = item.data.map(error =>
                    `<error message="${error.word} ${error.suggest ? '-> ' + error.suggest.join(', ') : ''}"/>`
                ).join('');
                return `<testcase classname="${item.resource}" name="${item.resource}" file="${item.resource}" time="${msToSec(item.time)}">
                     ${errors}
                </testcase>`;
            }).join('\n');
            fs.writeFileSync(filename, header + items + footer);
            consoleInfo(`Junit report: ./${filename}`);
        } catch (e) {
            consoleError(e);
        }
    }
};
