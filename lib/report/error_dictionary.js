'use strict';

const fs = require('fs');
const chalk = require('chalk');
const utils = require('../utils');

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

        buffer = utils.uniq(buffer).sort(function(a, b) {
            a = a.toLowerCase();
            b = b.toLowerCase();

            if (a > b) {
                return 1;
            } else if (a === b) {
                return 0;
            } else {
                return -1;
            }
        });

        try {
            fs.writeFileSync(this.filename, JSON.stringify(buffer, null, '  '));
            console.log(chalk.cyan('JSON dictionary with typos: ./' + this.filename));
        } catch(e) {
            console.error(chalk.red(e));
        }
    }
};
