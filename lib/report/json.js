var fs = require('fs'),
    pth = require('path'),
    chalk = require('chalk');

module.exports = {
    onend: function(data) {
        var dir = pth.resolve('./yaspeller');

        try {
            if(!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            fs.writeFileSync(pth.join(dir, 'report.json'), JSON.stringify(data, null, '  '));
            console.log(chalk.cyan('JSON report: ./yaspeller/report.json'));
        } catch(e) {
            console.error(e);
        }
    }
};
