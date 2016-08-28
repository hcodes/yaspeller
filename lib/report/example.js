'use strict';

module.exports = {
    oneach(err, data) {
        console.log('oneach: ', err, data);
    },
    onend(data, stats) {
        console.log('onend: ', data, stats);
    }
};
