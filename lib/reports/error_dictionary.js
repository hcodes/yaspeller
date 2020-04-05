'use strict';

const fs = require('fs');

const { uniq } = require('../helpers/array');
const { jsonStringify } = require('../helpers/string');
const { consoleError, consoleInfo } = require('../helpers/console');

const filename = 'yaspeller_error_dictionary.json';

module.exports = {
    name: 'error_dictionary',
    onComplete(data) {
        let buffer = [];

        data.forEach(function(el) {
            const error = el[0];
            const typos = el[1];

            if (!error) {
                typos.data.forEach(function(typo) {
                    if (typo.word) {
                        buffer.push(typo.word);
                    }
                });
            }
        });

        buffer = uniq(buffer).sort(function(a, b) {
            a = a.toLowerCase();
            b = b.toLowerCase();

            if (a > b) {
                return 1;
            }
            if (a < b) {
                return -1;
            }

            return 0;
        });

        try {
            fs.writeFileSync(filename, jsonStringify(buffer));
            consoleInfo(`JSON dictionary with typos: ./${filename}`);
        } catch (e) {
            consoleError(e);
        }
    }
};
