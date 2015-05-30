// jshint maxlen: 256
module.exports = {
    /**
     * Has ignored text?
     *
     * @param {string} text
     * @return {boolean}
     */
    hasIgnoredText: function(text) {
        return text.search(/yaspeller\s+ignore/) !== -1;
    },
    /**
     * Ignore lines.
     *
     * @param {string} text
     * @return {text}
     */
    lines: function(text) {
        return text
            .replace(/^.*?\/\/\s*yaspeller\s+ignore\s*$/mg, '')
            .replace(/^.*?<!--\s*yaspeller\s+ignore\s*-->.*?$/mg, '')
            .replace(/^.*?\/\*\s*yaspeller\s+ignore\s*\*\/.*?$/mg, '');
    },
    /**
     * Ignore blocks.
     *
     * @param {string} text
     * @return {text}
     */
    blocks: function(text) {
        return text
            .replace(/\/\*\s*yaspeller\s+ignore:start\s*\*\/[^]*?\/\*\s*yaspeller\s+ignore:end\s*\*\//g, '')
            .replace(/<!--\s*yaspeller\s+ignore:start\s*-->[^]*?<!--\s*yaspeller\s+ignore:end\s*-->/g, '')
            .replace(/\/\/\s*yaspeller\s+ignore:start[^]*?\/\/\s*yaspeller\s+ignore:end.*?(\r?\n|$)/g, '');
    },
    /**
     * Ignore HTML comments.
     *
     * @param {string} text
     * @return {text}
     */
    comments: function(text) {
        var comments = [
            ['<!--', '-->'],
            ['<!ENTITY', '>'],
            ['<!DOCTYPE', '>'],
            ['<\\?xml', '\\?>'],
            ['<!\\[CDATA\\[', '\\]\\]>']
        ];

        comments.forEach(function(tag) {
            var re = new RegExp(tag[0] + '[^]*?' + tag[1], 'gi');
            text = text.replace(re, ' ');
        });

        return text;
    },
    /**
     * Ignore tags.
     *
     * @param {string} text
     * @param {Array} tags
     * @return {text}
     */
    tags: function(text, tags) {
        var bufTags = [];
        tags.forEach(function(tag) {
            bufTags.push(['<' + tag + '(\\s[^>]*?)?>', '</' + tag + '>']);
        }, this);

        bufTags.forEach(function(tag) {
            var re = new RegExp(tag[0] + '[^]*?' + tag[1], 'gi');
            text = text.replace(re, ' ');
        });

        return text;
    }
};
