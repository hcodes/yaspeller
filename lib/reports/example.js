'use strict';

module.exports = {
    onStart() {
        console.log('oSstart');
    },
    onResourceComplete(err, data) {
        console.log('onResourceComplete: ', err, data);
    },
    onComplete(data, stats) {
        console.log('on: ', data, stats);
    }
};
