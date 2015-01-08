yaspeller
=========
[![NPM version](https://img.shields.io/npm/v/yaspeller.svg)](https://www.npmjs.com/package/yaspeller)
[![Build Status](https://img.shields.io/travis/hcodes/yaspeller.svg)](https://travis-ci.org/hcodes/yaspeller)
[![Coverage Status](https://img.shields.io/coveralls/hcodes/yaspeller.svg)](https://coveralls.io/r/hcodes/yaspeller)
[![Dependency Status](https://img.shields.io/david/hcodes/yaspeller.svg)](https://david-dm.org/hcodes/yaspeller)
[![devDependency Status](https://img.shields.io/david/dev/hcodes/yaspeller.svg)](https://david-dm.org/hcodes/yaspeller#info=devDependencies)

Search tool typos in the text, files and websites.

Used API [Yandex.Speller](https://tech.yandex.ru/speller/doc/dg/concepts/About-docpage/).
 
## Install
`npm install yaspeller -g`

## CLI
`yaspeller [options] <file-or-directory-or-link...>`

### Examples
+ `yaspeller README.md` — search typos in the file.
+ `yaspeller ./texts/` — finding typos in files (xml, html, htm, txt, text, svg, md, wiki) in the folder.
+ `yaspeller http://www.yandex.ru/` — search typos in the page.
+ `yaspeller http://bem.info/sitemap.xml` — search typos at the addresses specified in the sitemap.xml.

### Options

#### `-f, --format <value>`
Formats: `plain` or `html`. Default: `plain`.

#### `-l, --lang <value>`
Languages: `en`, `ru`, `tr` or `uk`. Default: `en,ru`.

#### `--report` TODO
Generate html report `./yaspeller.html`.

#### `--dictionary <file>`
Json file for own dictionary.

#### `--no-colors`
Clean output without colors.

#### `--max-requests`
Max count of requests at a time.

#### `--only-errors`
Output only errors.

#### `--debug`
Debug mode.

#### `--ignore-uppercase`
Ignore words written in capital letters.

#### `--ignore-digits`
Ignore words with numbers, such as `avp17h4534`.

#### `--ignore-urls`
Ignore Internet addresses, email addresses and filenames.

#### `--find-repeat-words`
Highlight repetitions of words, consecutive. For example, `I flew to to to Cyprus`.

#### `--ignore-latin`
Ignore words, written in Latin, for example, `madrid`.

#### `--no-suggest`
Just check the text, without giving options to replace.

#### `--flag-latin`
Celebrate words, written in Latin, as erroneous.

#### `--by-words`
Do not use a dictionary environment (context) during the scan.
This is useful in cases where the service is transmitted to the input of a list of individual words.

#### `--ignore-capitalization`
Ignore the incorrect use of UPPERCASE / lowercase letters, for example, in the word `moscow`.

#### `--ignore-roman-numerals`
Ignore Roman numerals `I, II, III, ...`.

## [License](./LICENSE.md)
MIT License
