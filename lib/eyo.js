'use strict';

const Eyo = require('eyo-kernel');
const eyo = new Eyo();

let isInited = false;

module.exports = function(text) {
    if (!isInited) {
        eyo.dictionary.loadSafeSync();
        isInited = true;
    }
    
    return eyo.lint(text, true);
};
