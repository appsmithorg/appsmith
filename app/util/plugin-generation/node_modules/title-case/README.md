# Title Case

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

Title case a string.

Supports Unicode (non-ASCII characters) and non-string entities, such as objects with a `toString` property, numbers and booleans. Empty values (`null` and `undefined`) will result in an empty string.

## Installation

```
npm install title-case --save
```

## Usage

```javascript
var titleCase = require('title-case');

titleCase('string')     //=> "String"
titleCase('PascalCase') //=> "Pascal Case"

titleCase('STRING', 'tr') //=> "Strıng"
```

## Typings

Includes a [TypeScript definition](title-case.d.ts).

## License

MIT

[npm-image]: https://img.shields.io/npm/v/title-case.svg?style=flat
[npm-url]: https://npmjs.org/package/title-case
[downloads-image]: https://img.shields.io/npm/dm/title-case.svg?style=flat
[downloads-url]: https://npmjs.org/package/title-case
[travis-image]: https://img.shields.io/travis/blakeembrey/title-case.svg?style=flat
[travis-url]: https://travis-ci.org/blakeembrey/title-case
[coveralls-image]: https://img.shields.io/coveralls/blakeembrey/title-case.svg?style=flat
[coveralls-url]: https://coveralls.io/r/blakeembrey/title-case?branch=master
