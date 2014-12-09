var chalk = require('chalk'),
    isDebug = false;

module.exports = {
    setDebug: function(val) {
        isDebug = val;
    },
    print: function(text) {
        isDebug && console.log(chalk.cyan('[DEBUG]') + ' ' + text);
    }
};
