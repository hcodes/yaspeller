'use strict';

const fs = require('fs');
const chalk = require('chalk');

module.exports = {
    filename: 'yaspeller_report.json',
    onend(data) {
        try {
            fs.writeFileSync(this.filename, JSON.stringify(data, null, '  '));
            console.log(chalk.cyan('JSON report: ./' + this.filename));
        } catch(e) {
            console.error(chalk.red(e));
        }
    }
};
