# isBinaryFile

Detects if a file is binary in Node.js using ✨promises✨. Similar to [Perl's `-B` switch](http://stackoverflow.com/questions/899206/how-does-perl-know-a-file-is-binary), in that:
- it reads the first few thousand bytes of a file
- checks for a `null` byte; if it's found, it's binary
- flags non-ASCII characters. After a certain number of "weird" characters, the file is flagged as binary

Much of the logic is pretty much ported from [ag](https://github.com/ggreer/the_silver_searcher).

Note: if the file doesn't exist or is a directory, an error is thrown.

## Installation

```
npm install isbinaryfile
```

## Usage

Returns `Promise<boolean>` (or just `boolean` for `*Sync`). `true` if the file is binary, `false` otherwise.

### isBinaryFile(filepath)

* `filepath` -  a `string` indicating the path to the file.

### isBinaryFile(bytes[, size])

* `bytes` - a `Buffer` of the file's contents.
* `size` - an optional `number` indicating the file size.

### isBinaryFileSync(filepath)

* `filepath` - a `string` indicating the path to the file.


### isBinaryFileSync(bytes[, size])

* `bytes` - a `Buffer` of the file's contents.
* `size` - an optional `number` indicating the file size.

### Examples

Here's an arbitrary usage:

```javascript
const isBinaryFile = require("isbinaryfile").isBinaryFile;
const fs = require("fs");

const filename = "fixtures/pdf.pdf";
const data = fs.readFileSync(filename);
const stat = fs.lstatSync(filename);

isBinaryFile(data, stat.size).then((result) => {
  if (result) {
    console.log("It is binary!")
  }
  else {
    console.log("No it is not.")
  }
});

const isBinaryFileSync = require("isbinaryfile").isBinaryFileSync;
const bytes = fs.readFileSync(filename);
const size = fs.lstatSync(filename).size;
console.log(isBinaryFileSync(bytes, size)); // true or false
```

## Testing

Run `npm install`, then run `npm test`.
