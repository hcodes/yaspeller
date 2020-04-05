'use strict';

const fs = require('fs');

const { jsonStringify } = require('../helpers/string');
const { consoleError, consoleInfo } = require('../helpers/console');

const filename = 'yaspeller_report.json';

module.exports = {
    name: 'json',
    onComplete(data) {
        try {
            fs.writeFileSync(filename, jsonStringify(data));
            consoleInfo(`JSON report: ./${filename}`);
        } catch (e) {
            consoleError(e);
        }
    }
};
