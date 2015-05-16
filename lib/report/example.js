module.exports = {
    oneach: function(err, data) {
        console.log('oneach: ', err, data);
    },
    onend: function(data, stats) {
        console.log('onend: ', data, stats);
    }
};
