'use strict';

module.exports = {
    name: 'example',
    onStart() {
        console.log('onStart');
    },
    onResourceComplete(error, data) {
        console.log('onResourceComplete', error, data);
    },
    onComplete(data, stats) {
        console.log('onComplete', data, stats);
    }
};
