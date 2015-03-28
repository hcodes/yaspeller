var chalk = require('chalk'),
    fs = require('fs'),
    minimatch = require('minimatch'),
    pth = require('path'),
    debug = require('../lib/debug'),
    printDebug = debug.print;

function loadConfig(file) {
    var data = null;
    if(fs.existsSync(file)) {
        try {
            data = JSON.parse(fs.readFileSync(file));
            printDebug('Using config: ' + file);
        } catch(e) {
            console.error(chalk.red('Error parsing ' + file));
            process.exit(2);
        }
    }

    return data;
}

function isDir(dir) {
    return fs.statSync(dir).isDirectory();
}

module.exports = {
    /**
     * Get JSON config.
     *
     * @param {string} file
     * @return {Object}
     */
    getConfig: function(file) {
        var data = null;

        printDebug('get/check JSON config');

        if(file) {
            data = loadConfig(file);
        } else {
            data = loadConfig('./.yaspellerrc');
            if(!data) {
                data = loadConfig('./.yaspeller.json');
            }
        }

        return data || {};
    },
    /**
     * Find files to search for typos.
     *
     * @param {Object[]} dir - Array of typos.
     * @param {string[]} fileExtensions
     * @param {string[]} excludeFiles
     * @return {Object[]}
     */
    findFiles: function(dir, fileExtensions, excludeFiles) {
        var res = [],
            find = function(path) {
                var files = fs.readdirSync(path);
                files.forEach(function(el) {
                    var file = pth.resolve(path, el),
                        ext = pth.extname(file);
                    for(var i = 0; i < excludeFiles.length; i++) {
                        if(minimatch(file, pth.resolve(excludeFiles[i]), {dot: true})) {
                            return;
                        }
                    }

                    if(isDir(file)) {
                        find(file);
                    } else if(!fileExtensions.length || fileExtensions.indexOf(ext) !== -1) {
                        res.push(file);
                    }
                });
            };

        if(isDir(dir)) {
            find(dir);
        } else {
            res.push(dir);
        }

        return res;
    },
    /**
     * Is Windows?
     *
     * @return {boolean}
     */
    isWin: function() {
        return process.platform === 'win32';
    },
    /**
     * Get Ok symbol.
     *
     * @return {string}
     */
    getOkSym: function() {
        return this.isWin() ? '[OK]' : '✓';
    },
    /**
     * Get error symbol.
     *
     * @return {string}
     */
    getErrSym: function() {
        return this.isWin() ? '[ERR]' : '✗';
    }
};
