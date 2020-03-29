'use strict';

const fs = require('fs');
const chalk = require('chalk');

const { jsonStringify } = require('../helpers/string');

module.exports = {
    filename: 'yaspeller_report.json',
    onend(data) {
        try {
            fs.writeFileSync(this.filename, jsonStringify(data));
            console.log(chalk.cyan('JSON report: ./' + this.filename));
        } catch (e) {
            console.error(chalk.red(e));
        }
    }
};
