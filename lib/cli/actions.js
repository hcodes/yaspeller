'use strict';

const fs = require('fs');

const { defaultConfig } = require('../config');
const { jsonStringify } = require('../helpers/string');
const { consoleWarn, consoleInfo } = require('../helpers/console');

function cliActionInit() {
    const yrc = '.yaspellerrc';

    if (fs.existsSync(yrc)) {
        consoleWarn(`File ${yrc} has already been created.`);
    } else {
        fs.writeFileSync(yrc, jsonStringify(defaultConfig));
        consoleInfo(`Successfully created ${yrc} file in ${process.cwd()}`);
    }

    process.exit();
}

module.exports = {
    cliActionInit,
};
