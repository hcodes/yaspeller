yaspeller
=========
[![NPM version](https://badge.fury.io/js/yaspeller.svg)](http://badge.fury.io/js/yaspeller)
[![Build Status](https://travis-ci.org/hcodes/yaspeller.png?branch=master)](https://travis-ci.org/hcodes/yaspeller)
[![Coverage Status](https://coveralls.io/repos/hcodes/yaspeller/badge.png?branch=master)](https://coveralls.io/r/hcodes/yaspeller)
[![Dependency Status](https://gemnasium.com/hcodes/yaspeller.svg)](https://gemnasium.com/hcodes/yaspeller)

Средство поиска опечаток в текстах, в файлах и на сайтах.

Используется API [Яндекс.Спеллера](https://tech.yandex.ru/speller/doc/dg/concepts/About-docpage/).
 
## Установка
`npm install yaspeller -g`
  
## Использование в командной строке
+ `yaspeller mytext.txt` - поиск опечаток в файле
+ `yaspeller ./texts/` - поиск опечаток в файлах (xml, html, htm, txt, text, svg, md, wiki, js, css) в папке
+ `yaspeller http://www.yandex.ru/` - поиск опечаток на сайте
+ `yaspeller http://bem.info/sitemap.xml` - поиск опечаток по всему сайту
