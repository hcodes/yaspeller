var request = require('request');

const YASPELLER_URL = 'http://speller.yandex.net/services/spellservice.json/checkText';

function getOptions(options) {
    var result = 0,
        standartOptions = {
        IGNORE_UPPERCASE: 1, // Пропускать слова, написанные заглавными буквами, например, "ВПК"
        IGNORE_DIGITS: 2, //Пропускать слова с цифрами, например, "авп17х4534"
        IGNORE_URLS: 4, // Пропускать интернет-адреса, почтовые адреса и имена файлов
        FIND_REPEAT_WORDS: 8, // Подсвечивать повторы слов, идущие подряд. Например, "я полетел на на Кипр"
        IGNORE_LATIN: 16, // Пропускать слова, написанные латиницей, например, "madrid"
        NO_SUGGEST: 32, // Только проверять текст, не выдавая вариантов для замены
        FLAG_LATIN: 128, // Отмечать слова, написанные латиницей, как ошибочные
        BY_WORDS: 256, // Не использовать словарное окружение (контекст) при проверке. Опция полезна в случаях, когда на вход сервиса передается список отдельных слов
        IGNORE_CAPITALIZATION: 512, // Игнорировать неверное употребление ПРОПИСНЫХ/строчных букв, например, в слове "москва"
        IGNORE_ROMAN_NUMERALS: 2048 // Игнорировать римские цифры ("I, II, III, ...")
    };
    
    Object.keys(options || {}).forEach(function(key) {
        if(standartOptions[key] && options[key]) {
            result |= standartOptions[key];
        }
    });
    
    return result;
}

function prepareText(text, format) {
    text = text.replace(/<\/?[^>]+>/g, ' ');
    text = text.replace(/\s+/g, ' ');
    text = ('' + text).trim();
    
    return text;
}

function checkText(text, lang, options, format, callback) {
    var bufText;
    
    if(Array.isArray(text)) {
        bufText = [];
        text.forEach(function(el) {
            var t = prepareText(text, format);
            if(t) {
                bufText.push(t);
            }
        });
    } else {
        bufText = prepareText(text, format);
    }
    
    if(Array.isArray(lang)) {
        lang = lang.join(',');
    }
    
    request.post(YASPELLER_URL, {
        form: {
            format: format || 'plain',
            lang: lang || 'ru,en',
            options: getOptions(options) || 0,
            text: bufText
        }
    }, function (error, response, body) {
        if(!error && response.statusCode === 200) {
            callback(false, JSON.parse(body));
        } else {
            callback(true, response.statusCode);
        }
    });
}

module.exports = {
    checkText: checkText
};
