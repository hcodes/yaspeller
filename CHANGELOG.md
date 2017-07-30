# Changelog

## 3.3.0
- Glob patterns for Windows
- Updated deps in package.json

# 3.2.0
- File extension with multiple dots #66, #67 @levonet

# 3.1.0
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
