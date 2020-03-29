'use strict';

var App = {
    init: function() {
        this.events();
        this.fixFileProtocol();
    },
    fixFileProtocol: function() {
        if (window.location.protocol === 'file:') {
            return;
        }

        var links = document.querySelectorAll('.page a');
        for (var i = 0, len = links.length; i < len; i++) {
            var link = links[i];
            if (link.href.search(/^file:/) !== -1) {
                link.removeAttribute('href');
            }
        }
    },
    events: function() {
        var ef = document.querySelector('.show-only-errors');
        ef && ef.addEventListener('click', function() {
            document.body.classList.toggle('show-only-errors_checked');
        }, false);
    }
};

App.init();
