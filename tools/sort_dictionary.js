'use strict';

const fs = require('fs');
const program = require('commander');

const { jsonStringify } = require('../lib/helpers/string');
const { uniq } = require('../lib/helpers/array');

function prepareWord(word) {
    return word.toLowerCase().replace(/[()[\]|?+.]/g, '');
}

function sortDictionary(words) {
    words.sort(function(a, b) {
        return prepareWord(a).localeCompare(prepareWord(b));
    });
}

program.parse(process.argv);

const filename = program.args[0];
let dict = JSON.parse(fs.readFileSync(filename).toString());
sortDictionary(dict);
dict = uniq(dict);

fs.writeFileSync(filename, jsonStringify(dict));
