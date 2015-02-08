yaspeller
=========
[![NPM version](https://img.shields.io/npm/v/yaspeller.svg)](https://www.npmjs.com/package/yaspeller)
[![Build Status](https://img.shields.io/travis/hcodes/yaspeller.svg)](https://travis-ci.org/hcodes/yaspeller)
[![Coverage Status](https://img.shields.io/coveralls/hcodes/yaspeller.svg)](https://coveralls.io/r/hcodes/yaspeller)
[![Dependency Status](https://img.shields.io/david/hcodes/yaspeller.svg)](https://david-dm.org/hcodes/yaspeller)
[![devDependency Status](https://img.shields.io/david/dev/hcodes/yaspeller.svg)](https://david-dm.org/hcodes/yaspeller#info=devDependencies)

Средство поиска опечаток в тексте, в файлах и на сайтах.

Используется API [Yandex.Speller](https://tech.yandex.ru/speller/doc/dg/concepts/About-docpage/).

![yaspeller](https://raw.githubusercontent.com/hcodes/yaspeller/master/images/cli.png)

## Установка
`npm install yaspeller -g`

## Командная строка
`yaspeller [options] <file-or-directory-or-link...>`

### Примеры
+ `yaspeller README.md` — поиск опечаток в файле.
+ `yaspeller ./texts/` — поиск опечаток в файлах в папке.
+ `yaspeller http://www.yandex.ru/` — поиск опечаток на сайте.
+ `yaspeller http://bem.info/sitemap.xml` — поиск опечаток в адресах, перечисленных в sitemap.xml.

### Опции

#### `-f, --format <value>`
Форматы: `plain`, `html`, `markdown` или `auto`.<br/>
По умолчанию: `plain`.

#### `-l, --lang <value>`
Языки: `en`, `kk`, `ru` or `uk`.<br/>
По умолчанию: `en,ru`.

#### `-c, --config <path>`
Конфигурационный файл.

#### `--file-extensions <value>`
Поиск файлов в папке по расширениям.<br/>
Пример: `.md,.htm,.txt`.

#### `--dictionary <file>`
JSON-файл собственного словаря.
```JSON
[
    "someword1",
    "someword2",
    "someword3"
]
```

#### `--report <type>`
Задать вид отчёта: `console`, `html` или `json`.<br/>
По умолчанию: `console`<br/>
Пример: `console,html,custom_report.js`

#### `--by-words`
Не использовать словарное окружение (контекст) при проверке.<br/>
Опция полезна в случаях, когда на вход сервиса передается список отдельных слов.

#### `--find-repeat-words`
Находить повторы слов, идущие подряд. Например, `я полетел на на Кипр`.

#### `--flag-latin`
Отмечать слова, написанные латиницей, как ошибочные.

#### `--ignore-capitalization`
Игнорировать неверное употребление ПРОПИСНЫХ/строчных букв, например, в слове `москва`.

#### `--ignore-digits`
Пропускать слова с цифрами, например, `авп17х4534`.

#### `--ignore-latin`
Пропускать слова, написанные латиницей, например, `madrid`.

#### `--ignore-roman-numerals`
Игнорировать римские цифры `I, II, III, ...`.

#### `--ignore-uppercase`
Пропускать слова, написанные заглавными буквами, например, `ВПК`.

#### `--ignore-urls`
Пропускать интернет-адреса, почтовые адреса и имена файлов.

#### `--max-requests <value>`
Одновременное количество запросов к API Yandex.Speller.<br/>
По умолчанию: `2`.

#### `--no-colors`
Консольный вывод без цвета.

#### `--only-errors`
Выводить только ошибки.

#### `--debug`
Режим отладки.

## Установка в проект
`npm install yaspeller --save-dev`

Необходимо добавить в `package.json` / `scripts`:<br/>
`    "yaspeller": "./node_modules/.bin/yaspeller .",`

Для запуска в качестве линтера:<br/>
`npm run yaspeller`

`yaspeller` настраивается, используя `.yaspellerrc` или `.yaspeller.json`, расположенный в корне проекта.
```JSON
{
  "excludeFiles": [
    ".git",
    "yaspeller",
    "node_modules",
    "libs"
  ],
  "format": "auto",
  "lang": "ru",
  "fileExtensions": [
    ".md",
    ".js",
    ".css"
  ],
  "dictionary": [
    "someword1"
  ]
}
```

| Свойство | Тип | Подробности |
|----------|------|---------|
| `format` | `String` | [`--format`](#-f---format-value) |
| `lang`   | `String` | [`--lang`](#-l---lang-value) |
| `excludeFiles` | `Array` | |
| `fileExtensions` | `Array` | [`--file-extension`](#--file-extensions-value) |
| `dictionary` | `Array` | [`--dictionary`](#--dictionary-file) |
| `byWords`    | `Boolean` | [`--by-words`](#--by-words) |
| `findRepeatWords` | `Boolean` | [`--find-repeat-words`](#--find-repeat-words) |
| `flagLatin` | `Boolean` | [`--flag-latin`](#--flag-latin) |
| `ignoreCapitalization` | `Boolean` | [`--ignore-capitalization`](#--ignore-capitalization) |
| `ignoreDigits` | `Boolean` | [`--ignore-digits`](#--ignore-digits) |
| `ignoreLatin` | `Boolean` | [`--ignore-latin`](#--ignore-latin) |
| `ignoreRomanNumerals` | `Boolean` | [`--ignore-roman-numerals`](#--ignore-roman-numerals) |
| `ignoreUppercase` | `Boolean` | [`--ignore-uppercase`](#--ignore-uppercase) |
| `ignoreUrls` | `Boolean` | [`--ignore-urls`](#--ignore-urls) |
| `maxRequests` | `Boolean` | [`--max-requests`](#--max-requests-value) |

## [Лицензия](./LICENSE.ru.md)
MIT License
