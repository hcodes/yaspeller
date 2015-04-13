var fs = require('fs'),
    chalk = require('chalk'),
    _ = require('lodash');

module.exports = {
    onend: function(data) {
        var filename = 'yaspeller.error_dictionary.json',
            buffer = [];

        data.forEach(function(el) {
            var error = el[0],
                typos = el[1];
            if(!error) {
                typos.data.forEach(function(typo) {
                    if(typo.word) {
                        buffer.push(typo.word);
                    }
                });
            }
        });

        buffer = _.uniq(buffer).sort(function(a, b) {
            a = a.toLowerCase();
            b = b.toLowerCase();

            if(a > b) {
                return 1;
            } else if(a === b) {
                return 0;
            } else {
                return -1;
            }
        });

        try {
            fs.writeFileSync(filename, JSON.stringify(buffer, null, '  '));
            console.log(chalk.cyan('JSON dictionary with typos: ./' + filename));
        } catch(e) {
            console.error(e);
        }
    }
};
