yaspeller
=========
Средство поиска опечаток в текстах, в файлах и на сайтах.

Используется API [Яндекс.Спеллера](https://tech.yandex.ru/speller/doc/dg/concepts/About-docpage/).

## Установка
`npm install yaspeller -g`
  
## Использование в командной строке
+ `yaspeller mytext.txt` - поиск опечаток в файле
+ `yaspeller ./texts/` - поиск опечаток в файлах (xml, html, htm, txt, text, svg, md, wiki, js, css) в папке
+ `yaspeller http://www.yandex.ru/` - поиск опечаток на сайте
+ `yaspeller http://bem.info/sitemap.xml` - поиск опечаток по всему сайту
