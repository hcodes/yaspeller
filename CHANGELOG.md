# Changelog

## v8.0.1
Update deps in package.json.

## v8.0.0
- Yaspeller requires Node.js 12 or higher.
- Reducing the size of dependencies #178 @alchazov.
- CLI `no-colors` option replaced with `no-color`.

## v7.2.1
-  --ignore-tags Not work properly in Markdown files with HTML #176

## v7.2.0
- Update deps in package.json
- Fixed sitemap bug #169

## v7.1.0
Added junit report #171 @Lootjs.

## v7.0.0
- Drop support for Node.js < 10.
- Add .yaspellerrc.js and .yaspellerrc.json for project config #153, #150

## v6.1.0
- Fix lost symlink #145, #128.
- Print row:col for repeated words #142, #134.
- Fix repeated words with code for markdown files #141, #134.

## v6.0.4
- Fix: print a typo warning at the end if there are typos #121.

## v6.0.3
- Updated deps in package.json.

## v6.0.2
- Updated deps in package.json.

## v6.0.1
- Updated deps in package.json.

## v6.0.0
- Drop support for old Node.js < 8.
- Update deps in package.json

## v5.1.0
- Updated deps in package.json.
- Add warning where to fix a typo #115.

## v5.0.1
- FIX: sitemap.xml - TypeError: Cannot read property 'replace' of undefined #113.

## v5.0.0
- FIX: **Breaking changes**: Incorrect work of dictionary words in substrings #106.
- FIX: Comments in JSON  #108.

## v4.2.1
FIX: TypeError: Cannot destructure property config of 'undefined' or 'null' #103.

## v4.2.0
`yaspeller` field in `package.json` #100 (@thepocp), #101 (@shashkovdanil).

## v4.1.0
- Updated deps in package.json.
- Warnings for unknown properties in config files #94.

## v4.0.3
Fixed exit code #87.

## v4.0.2
Fixed SyntaxError #83.

## 4.0.1
- Fixed error handling for Yandex.Speller API #84.
- Updated deps in package.json.

## 4.0.0
- Add --init CLI option #77
- Add --stdin and --stdin-filename CLI options #76

Before:
`echo "Hello, world!" | yaspeller`

After:
`echo "Hello, world!" | yaspeller --stdin`
or
`echo "Hello, world!" | yaspeller --stdin --stdin-filename hello.txt`

## 3.3.0
- Glob patterns for Windows
- Updated deps in package.json

## 3.2.0
- File extension with multiple dots #66, #67 @levonet

## 3.1.0
- Remove acute accent, shy and other symbols #65
- Updated deps in package.json

Bugs:
- Can't read options --config #61 @pavelpower
- Fix the error message in the dictionary.js #60 @vessd
- Fix(readme): translate 'или' to 'or' #57 @JLHwung

## 3.0.0
- Added line number in reports
- Removed support for old format of words in the dictionary
- A support for old Node version is dropped
- Updated deps in package.json

## 2.9.1
- Small fixes in README.md for npmjs.org

## 2.9.0
- Ability to ignore the text using regular expressions (`--ignore-text` for CLI or `ignoreText` for `.yaspellerrc`)
- Updated deps in package.json

## 2.8.2
- Small fix for stdin #48
- Updated deps in package.json

## 2.8.1
- Updated deps in package.json

## 2.8.0
- Added support for stdin
- Updated deps in package.json

## 2.7.0
- Separate module for Yandex.Speller API
- Updated deps in package.json

## 2.6.0
- Added filter “Show only errors” in HTML report
- Updated deps in package.json

## 2.5.1
- Updated deps in package.json

## 2.5.0
- Replace npm module `eyo` to `eyo-kernel`
- Output warnings of duplicate words in dictionaries
- Update deps in package.json
- Simplified regular expressions in words in the dictionary

Before (<= 2.4.0):
```js
[
  "someword1", // someword1 = someword1
  "Someword2", // Someword2 = Someword2
  "/some(w|W)ord[23]/", // some(w|W)ord[23] = some(w|W)ord[23]
  "/Some(w|W)ord/" // Some(w|W)ord = Some(w|W)ord
]
```

After (2.5.0):
```js
[
  "someword1", // someword1 = someword1 and Someword1
  "Someword2", // Someword2 = Someword2
  "some(w|W)ord[23]", // some(w|W)ord[23] = some(w|W)ord[23] and Some(w|W)ord[23]
  "Some(w|W)ord" // Some(w|W)ord = Some(w|W)ord
]
```

## 2.4.0
- Ability to ignore text when checking

### Bug fixes
- Fix JSON comments in dictionaries and config's

## 2.3.0
- JSON comments in dictionaries and config's #35
- Ability to specify multiple dictionaries in option --dictionary #33
- Markdown report #31
- Update deps in package.json

## 2.2.0
- Exit code for error loading in API #29.
- Update deps in package.json.

## 2.1.0
- Ability to use an empty parameter `--file-extensions` from CLI.

### Bug fixes
- Error with an unknown site.

## 2.0.1
### Bug fixes
- Load config after args is parsed #27

## 2.0.0
- Support for checking the letter Ё (`--check-yo` or `checkYo: true`).
- Dictionary of `.yaspellerrc` and specified on the command line are used together.
- Setting `fileExtensions` is not used for checking one file (`yaspeller -l ru my_file.txt`).
- Added report `error_dictionary` for the collection of typos in files.

## 1.1.0
- Use settings `excludeFiles` and `fileExtensions` for checking one file.
- Support for regular expressions #18.
- Fixed detection format #19.

## 1.0.6
- Update deps in package.json.
- Added changelog.

## 1.0.5
### Bug fixes
- Fix file protocol in html report.

## 1.0.4
### Bug fixes
- npm: Fix LF.

## 1.0.3
### Bug fixes
- Crash of Yaspeller when try Habrahabr url #22.

## 1.0.2
Initial public release.
