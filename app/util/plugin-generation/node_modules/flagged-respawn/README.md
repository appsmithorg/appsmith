<p align="center">
  <a href="http://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# flagged-respawn

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Travis Build Status][travis-image]][travis-url] [![AppVeyor Build Status][appveyor-image]][appveyor-url] [![Coveralls Status][coveralls-image]][coveralls-url] [![Gitter chat][gitter-image]][gitter-url]

A tool for respawning node binaries when special flags are present.

## What is it?

Say you wrote a command line tool that runs arbitrary javascript (e.g. task runner, test framework, etc). For the sake of discussion, let's pretend it's a testing harness you've named `testify`.

Everything is going splendidly until one day you decide to test some code that relies on a feature behind a v8 flag in node (`--harmony`, for example).  Without much thought, you run `testify --harmony spec tests.js`.

It doesn't work. After digging around for a bit, you realize this produces a [`process.argv`](http://nodejs.org/docs/latest/api/process.html#process_process_argv) of:

`['node', '/usr/local/bin/test', '--harmony', 'spec', 'tests.js']`

Crap. The `--harmony` flag is in the wrong place! It should be applied to the **node** command, not our binary. What we actually wanted was this:

`['node', '--harmony', '/usr/local/bin/test', 'spec', 'tests.js']`

Flagged-respawn fixes this problem and handles all the edge cases respawning creates, such as:
- Providing a method to determine if a respawn is needed.
- Piping stderr/stdout from the child into the parent.
- Making the parent process exit with the same code as the child.
- If the child is killed, making the parent exit with the same signal.

To see it in action, clone this repository and run `npm install` / `npm run respawn` / `npm run nospawn`.

## Sample Usage

```js
#!/usr/bin/env node

const flaggedRespawn = require('flagged-respawn');

// get a list of all possible v8 flags for the running version of node
const v8flags = require('v8flags').fetch();

flaggedRespawn(v8flags, process.argv, function (ready, child) {
  if (ready) {
    console.log('Running!');
    // your cli code here
  } else {
    console.log('Special flags found, respawning.');
  }
  if (process.pid !== child.pid) {
    console.log('Respawned to PID:', child.pid);
  }
});

```


## API

### <u>flaggedRespawn(flags, argv, [ forcedFlags, ] callback) : Void</u>

Respawns the script itself when *argv* has special flag contained in *flags* and/or *forcedFlags* is not empty. Because members of *flags* and *forcedFlags* are passed to `node` command, each of them needs to be a node flag or a V8 flag.

#### Forbid respawning

If `--no-respawning` flag is given in *argv*, this function does not respawned even if *argv* contains members of flags or *forcedFlags* is not empty. (This flag is also used internally to prevent from respawning more than once).

#### Parameter:

| Parameter     |  Type  | Description |
|:--------------|:------:|:----------------------------------------------------|
| *flags*       | Array  | An array of node flags and V8 flags which are available when present in *argv*. |
| *argv*        | Array  | Command line arguments to respawn.   |
| *forcedFlags* | Array or String  | An array of node flags or a string of a single flag and V8 flags for respawning forcely. |
| *callback*    | function | A called function when not respawning or after respawned. |

* **<u><i>callback</i>(ready, proc, argv) : Void</u>**

    *callback* function is called both when respawned or not, and it can be distinguished by callback's argument: *ready*. (*ready* indicates whether a process spawned its child process (false) or not (true), but it does not indicate whether a process is a spawned child process or not. *ready* for a spawned child process is true.)

    *argv* is an array of command line arguments which is respawned (when *ready* is false) or is passed current process except flags within *flags* and `--no-respawning` (when *ready* is true).

    **Parameter:**

    | Parameter |  Type   | Description               |
    |:----------|:-------:|:--------------------------|
    | *ready*   | boolean | True, if not respawning and is ready to execute main function. |
    | *proc*    | object  | Child process object if respawned, otherwise current process object. |
    | *argv*    | Array   | An array of command line arguments. |

## License

MIT

[downloads-image]: http://img.shields.io/npm/dm/flagged-respawn.svg
[npm-url]: https://www.npmjs.com/package/flagged-respawn
[npm-image]: http://img.shields.io/npm/v/flagged-respawn.svg

[travis-url]: https://travis-ci.org/gulpjs/flagged-respawn
[travis-image]: http://img.shields.io/travis/gulpjs/flagged-respawn.svg?label=travis-ci

[appveyor-url]: https://ci.appveyor.com/project/gulpjs/flagged-respawn
[appveyor-image]: https://img.shields.io/appveyor/ci/gulpjs/flagged-respawn.svg?label=appveyor

[coveralls-url]: https://coveralls.io/r/gulpjs/flagged-respawn
[coveralls-image]: http://img.shields.io/coveralls/gulpjs/flagged-respawn/master.svg

[gitter-url]: https://gitter.im/gulpjs/gulp
[gitter-image]: https://badges.gitter.im/gulpjs/gulp.svg
