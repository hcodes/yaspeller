var fs = require('fs'),
    pth = require('path'),
    chalk = require('chalk');

module.exports = {
    onend: function(data) {
        try {
            fs.writeFileSync('yaspeller_report.json', JSON.stringify(data, null, '  '));
            console.log(chalk.cyan('JSON report: ./yaspeller_report.json'));
        } catch(e) {
            console.error(e);
        }
    }
};
