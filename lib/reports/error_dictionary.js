'use strict';

const fs = require('fs');
const chalk = require('chalk');

const { uniq } = require('../helpers/array');
const { jsonStringify } = require('../helpers/string');

module.exports = {
    filename: 'yaspeller_error_dictionary.json',
    onend(data) {
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
            fs.writeFileSync(this.filename, jsonStringify(buffer));
            console.log(chalk.cyan('JSON dictionary with typos: ./' + this.filename));
        } catch (e) {
            console.error(chalk.red(e));
        }
    }
};
