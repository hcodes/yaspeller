var chalk = require('chalk'),
    pth = require('path'),
    reports = [],
    reportNames = {},
    buffer = [];

module.exports = {
    addReports: function(names) {
        names.forEach(function(name) {
            var moduleName = pth.extname(name) === '.js' ? name : './report/' + name;
            if(reportNames[moduleName]) {
                return;
            }

            try {
                reportNames[moduleName] = true;
                reports.push(require(moduleName));
            } catch(e) {
                console.error(chalk.red('Can\'t load report module "' + moduleName + '".'));
                console.error(chalk.red(e));
            }
        });
    },
    oneach: function(err, data, dictionary) {
        buffer.push([err, data]);

        reports.forEach(function(name) {
            name.oneach && name.oneach(err, data, dictionary);
        });
    },
    onend: function() {
        reports.forEach(function(name) {
            name.onend && name.onend(buffer);
        });
    }
};
