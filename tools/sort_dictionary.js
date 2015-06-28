'use strict';

var fs = require('fs'),
    _ = require('lodash'),
    program = require('commander');

program.parse(process.argv);

function sortDictionary(words) {
    function prepare(word) {
        return word.toLowerCase().replace(/[()[\]|?+.]/g, '');
    }

    words.sort(function(a, b) {
        return prepare(a).localeCompare(prepare(b));
    });
}

program.parse(process.argv);

var filename = program.args[0],
    dict = JSON.parse(fs.readFileSync(filename).toString());

sortDictionary(dict);
dict = _.unique(dict);

fs.writeFileSync(filename, JSON.stringify(dict, null, '  '));
