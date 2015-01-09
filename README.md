yaspeller
=========
[![NPM version](https://img.shields.io/npm/v/yaspeller.svg)](https://www.npmjs.com/package/yaspeller)
[![Build Status](https://img.shields.io/travis/hcodes/yaspeller.svg)](https://travis-ci.org/hcodes/yaspeller)
[![Coverage Status](https://img.shields.io/coveralls/hcodes/yaspeller.svg)](https://coveralls.io/r/hcodes/yaspeller)
[![Dependency Status](https://img.shields.io/david/hcodes/yaspeller.svg)](https://david-dm.org/hcodes/yaspeller)
[![devDependency Status](https://img.shields.io/david/dev/hcodes/yaspeller.svg)](https://david-dm.org/hcodes/yaspeller#info=devDependencies)

Search tool typos in the text, files and websites.

Used API [Yandex.Speller](https://tech.yandex.ru/speller/doc/dg/concepts/About-docpage/).

## Installation
`npm install yaspeller -g`

## Using CLI
`yaspeller [options] <file-or-directory-or-link...>`

### Examples
+ `yaspeller README.md` — search typos in the file.
+ `yaspeller ./texts/` — finding typos in files (xml, html, htm, txt, text, svg, md, wiki) in the folder.
+ `yaspeller http://www.yandex.ru/` — search typos in the page.
+ `yaspeller http://bem.info/sitemap.xml` — search typos at the addresses specified in the sitemap.xml.

### Options

#### `-f, --format <value>`
Formats: `plain` or `html`.
Default: `plain`.

#### `-l, --lang <value>`
Languages: `en`, `kk`, `ru` or `uk`.<br/>
Default: `en,ru`.

#### `--file-extensions <value>`
Set file extensions to search for files in a folder.<br/>
Default: `md,htm,html,txt,text,svg,wiki,xhtml,xml`.

#### `--dictionary <file>`
JSON file for own dictionary.
```JSON
[
    "someword1",
    "someword2",
    "someword3"
]
```

#### `--by-words`
Do not use a dictionary environment (context) during the scan.<br/>
This is useful in cases where the service is transmitted to the input of a list of individual words.

#### `--find-repeat-words`
Highlight repetitions of words, consecutive. For example, `I flew to to to Cyprus`.

#### `--flag-latin`
Celebrate words, written in Latin, as erroneous.

#### `--ignore-capitalization`
Ignore the incorrect use of UPPERCASE / lowercase letters, for example, in the word `moscow`.

#### `--ignore-digits`
Ignore words with numbers, such as `avp17h4534`.

#### `--ignore-latin`
Ignore words, written in Latin, for example, `madrid`.

#### `--ignore-roman-numerals`
Ignore Roman numerals `I, II, III, ...`.

#### `--ignore-uppercase`
Ignore words written in capital letters.

#### `--ignore-urls`
Ignore Internet addresses, email addresses and filenames.

#### `--max-requests <value>`
Max count of requests at a time.<br/>
Default: `2`.

#### `--no-colors`
Clean output without colors.

#### `--only-errors`
Output only errors.

#### `--debug`
Debug mode.

## Configuration
`npm install yaspeller --save-dev`

Add the text in `package.json` / `scripts`:
`    "yaspeller": "./node_modules/.bin/yaspeller .",`

To run the linter:
`npm run yaspeller`

Yaspeller is configured using `.yaspellerrc` JSON file at the root of the project.
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
    "md",
    "js",
    "css"
  ],
  "dictionary": [
    "someword1"
  ]
}
```

| Property | Type | Details |
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
| `maxRequests` | `Boolean` | [`--max-requests`](#--max-requests-val) |

## [License](./LICENSE.md)
MIT License
