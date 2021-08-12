# Sentence Case

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

Sentence case a string. Explicitly adds a single underscore between groups of numbers to maintain readability and reversibility (E.g. `1.20.5` becomes `1_20_5`, not `1205`), by default.

Supports Unicode (non-ASCII characters) and non-string entities, such as objects with a `toString` property, numbers and booleans. Empty values (`null` and `undefined`) will result in an empty string.

## Installation

### Node

```
npm install sentence-case --save
```

## Usage

```javascript
var sentenceCase = require('sentence-case')

sentenceCase('string')         //=> "String"
sentenceCase('dot.case')       //=> "Dot case"
sentenceCase('PascalCase')     //=> "Pascal case"
sentenceCase('version 1.2.10') //=> "Version 1 2 10"

sentenceCase('STRING 1.2', 'tr') //=> "Strıng 1 2"
```

## Typings

Includes a [TypeScript definition](sentence-case.d.ts).

## License

MIT

[npm-image]: https://img.shields.io/npm/v/sentence-case.svg?style=flat
[npm-url]: https://npmjs.org/package/sentence-case
[downloads-image]: https://img.shields.io/npm/dm/sentence-case.svg?style=flat
[downloads-url]: https://npmjs.org/package/sentence-case
[travis-image]: https://img.shields.io/travis/blakeembrey/sentence-case.svg?style=flat
[travis-url]: https://travis-ci.org/blakeembrey/sentence-case
[coveralls-image]: https://img.shields.io/coveralls/blakeembrey/sentence-case.svg?style=flat
[coveralls-url]: https://coveralls.io/r/blakeembrey/sentence-case?branch=master
