'use strict';

module.exports = {
    onstart() {
        console.log('onstart');
    },
    oneach(err, data) {
        console.log('oneach: ', err, data);
    },
    onend(data, stats) {
        console.log('onend: ', data, stats);
    }
};
