var chalk = require('chalk'),
    isDebug = false;

module.exports = {
    setDebug: function(val) {
        isDebug = val;
    },
    print: function(text) {
        if(isDebug) {
            if(typeof text === 'object') {
                console.log(chalk.cyan('[DEBUG]'));
                Object.keys(text).forEach(function(key) {
                    console.log(chalk.cyan('    ' + key + ': ') + text[key]);
                });
            } else {
                console.log(chalk.cyan('[DEBUG]') + ' ' + text);
            }
        }
    }
};
