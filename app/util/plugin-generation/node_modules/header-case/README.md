# Header Case

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

Header case a string.

Supports Unicode (non-ASCII characters) and non-string entities, such as objects with a `toString` property, numbers and booleans. Empty values (`null` and `undefined`) will result in an empty string.

## Installation

```
npm install header-case --save
```

## Usage

```javascript
var headerCase = require('header-case')

headerCase('string')     //=> "String"
headerCase('PascalCase') //=> "Pascal-Case"

headerCase('MY_STRING', 'tr') //=> "My-Strıng"
```

## Typings

Includes a [TypeScript definition](header-case.d.ts).

## License

MIT

[npm-image]: https://img.shields.io/npm/v/header-case.svg?style=flat
[npm-url]: https://npmjs.org/package/header-case
[downloads-image]: https://img.shields.io/npm/dm/header-case.svg?style=flat
[downloads-url]: https://npmjs.org/package/header-case
[travis-image]: https://img.shields.io/travis/blakeembrey/header-case.svg?style=flat
[travis-url]: https://travis-ci.org/blakeembrey/header-case
[coveralls-image]: https://img.shields.io/coveralls/blakeembrey/header-case.svg?style=flat
[coveralls-url]: https://coveralls.io/r/blakeembrey/header-case?branch=master
