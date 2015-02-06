var chalk = require('chalk'),
    reports = [],
    buffer = [];

module.exports = {
    addReports: function(names) {
        names.forEach(function(name) {
            var dir = name.search(/\.js$/) === -1 ? './report/' : '';
            try {
                reports.push(require(dir + name));
            } catch(e) {
                console.error(chalk.red('Can\'t load report module "' + name + '".'));
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
