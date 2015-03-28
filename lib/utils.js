var chalk = require('chalk'),
    fs = require('fs'),
    minimatch = require('minimatch'),
    pth = require('path'),
    stripJsonComments = require('strip-json-comments'),
    debug = require('../lib/debug'),
    printDebug = debug.print;

function loadConfig(file) {
    var data = null;

    if(fs.existsSync(file)) {
        try {
            var config = fs.readFileSync(file, 'utf8');
            if(['.js', '.json'].indexOf(pth.extname(file)) === -1) {
                config = stripJsonComments(config);
            }

            data = JSON.parse(config);

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
                fs.readdirSync(path).forEach(function(el) {
                    var file = pth.resolve(path, el);
                    if(this.isExcludedFile(file, excludeFiles)) {
                        return;
                    }

                    if(isDir(file)) {
                        find(file);
                    } else if(this.isReqFileExtension(file, fileExtensions)) {
                        res.push(file);
                    }
                }, this);
            }.bind(this);

        if(isDir(dir)) {
            find(dir);
        } else {
            res.push(dir);
        }

        return res;
    },
    /**
     * Is required file extension?
     *
     * @param {string} file
     * @param {string[]} fileExtensions
     *
     * @return {boolean}
     */
    isReqFileExtension: function(file, fileExtensions) {
        var ext = pth.extname(file);
        return !fileExtensions.length || fileExtensions.indexOf(ext) !== -1;
    },
    /**
     * Is excluded file?
     *
     * @param {string} file
     * @param {string[]} excludeFiles
     *
     * @return {boolean}
     */
    isExcludedFile: function(file, excludeFiles) {
        return excludeFiles.some(function(el) {
            return minimatch(file, pth.resolve(el), {dot: true});
        });
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
