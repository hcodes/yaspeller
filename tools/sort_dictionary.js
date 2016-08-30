'use strict';

const fs = require('fs');
const program = require('commander');

function sortDictionary(words) {
    function prepare(word) {
        return word.toLowerCase().replace(/[()[\]|?+.]/g, '');
    }

    words.sort(function(a, b) {
        return prepare(a).localeCompare(prepare(b));
    });
}

program.parse(process.argv);
program.parse(process.argv);

const filename = program.args[0];
let dict = JSON.parse(fs.readFileSync(filename).toString());
sortDictionary(dict);
dict = Array.from(new Set(dict)); // unique values

fs.writeFileSync(filename, JSON.stringify(dict, null, '  '));
