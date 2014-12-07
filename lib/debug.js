var chalk = require('chalk');

module.exports = function(text) {
    console.log(chalk.cyan('[DEBUG]') + ' ' + text);
};
