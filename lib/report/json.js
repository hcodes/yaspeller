var fs = require('fs'),
    chalk = require('chalk');

module.exports = {
    onend: function(data) {
        var filename = 'yaspeller_report.json';
        try {
            fs.writeFileSync(filename, JSON.stringify(data, null, '  '));
            console.log(chalk.cyan('JSON report: ./' + filename));
        } catch(e) {
            console.error(e);
        }
    }
};
