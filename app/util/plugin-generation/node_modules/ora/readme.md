# ora [![Build Status](https://travis-ci.org/sindresorhus/ora.svg?branch=master)](https://travis-ci.org/sindresorhus/ora)

> Elegant terminal spinner

<p align="center">
	<br>
	<img src="screenshot.svg" width="500">
	<br>
</p>


## Install

```
$ npm install ora
```

<a href="https://www.patreon.com/sindresorhus">
	<img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>


## Usage

```js
const ora = require('ora');

const spinner = ora('Loading unicorns').start();

setTimeout(() => {
	spinner.color = 'yellow';
	spinner.text = 'Loading rainbows';
}, 1000);
```


## API

### ora([options|text])

If a string is provided, it is treated as a shortcut for [`options.text`](#text).

#### options

Type: `Object`

##### text

Type: `string`

Text to display after the spinner.

##### prefixText

Type: `string`

Text to display before the spinner.

##### spinner

Type: `string` `Object`<br>
Default: `dots` <img src="screenshot-spinner.gif" width="14">

Name of one of the [provided spinners](https://github.com/sindresorhus/cli-spinners/blob/master/spinners.json). See `example.js` in this repo if you want to test out different spinners. On Windows, it will always use the `line` spinner as the Windows command-line doesn't have proper Unicode support.

Or an object like:

```js
{
	interval: 80, // Optional
	frames: ['-', '+', '-']
}
```

##### color

Type: `string`<br>
Default: `cyan`<br>
Values: `black` `red` `green` `yellow` `blue` `magenta` `cyan` `white` `gray`

Color of the spinner.

##### hideCursor

Type: `boolean`<br>
Default: `true`

Set to `false` to stop Ora from hiding the cursor.

##### indent

Type: `number`<br>
Default: `0`

Indent the spinner with the given number of spaces.

##### interval

Type: `number`<br>
Default: Provided by the spinner or `100`

Interval between each frame.

Spinners provide their own recommended interval, so you don't really need to specify this.

##### stream

Type: `stream.Writable`<br>
Default: `process.stderr`

Stream to write the output.

You could for example set this to `process.stdout` instead.

##### isEnabled

Type: `boolean`

Force enable/disable the spinner. If not specified, the spinner will be enabled if the `stream` is being run inside a TTY context (not spawned or piped) and/or not in a CI environment.

Note that `{isEnabled: false}` doesn't mean it won't output anything. It just means it won't output the spinner, colors, and other ansi escape codes. It will still log text.

### Instance

#### .start([text])

Start the spinner. Returns the instance. Set the current text if `text` is provided.

#### .stop()

Stop and clear the spinner. Returns the instance.

#### .succeed([text])

Stop the spinner, change it to a green `✔` and persist the current text, or `text` if provided. Returns the instance. See the GIF below.

#### .fail([text])

Stop the spinner, change it to a red `✖` and persist the current text, or `text` if provided. Returns the instance. See the GIF below.

#### .warn([text])

Stop the spinner, change it to a yellow `⚠` and persist the current text, or `text` if provided. Returns the instance.

#### .info([text])

Stop the spinner, change it to a blue `ℹ` and persist the current text, or `text` if provided. Returns the instance.

#### .isSpinning

A boolean of whether the instance is currently spinning.

#### .stopAndPersist([options])

Stop the spinner and change the symbol or text. Returns the instance. See the GIF below.

##### options

Type: `Object`

###### symbol

Type: `string`<br>
Default: `' '`

Symbol to replace the spinner with.

###### text

Type: `string`<br>
Default: Current `text`

Text to be persisted after the symbol

###### prefixText

Type: `string`<br>
Default: Current `prefixText`

Text to be persisted before the symbol.

<img src="screenshot-2.gif" width="480">

#### .clear()

Clear the spinner. Returns the instance.

#### .render()

Manually render a new frame. Returns the instance.

#### .frame()

Get a new frame.

#### .text

Change the text after the spinner.

#### .prefixText

Change the text before the spinner.

#### .color

Change the spinner color.

#### .spinner

Change the spinner.

#### .indent

Change the spinner indent.

### ora.promise(action, [options|text])

Starts a spinner for a promise. The spinner is stopped with `.succeed()` if the promise fulfills or with `.fail()` if it rejects. Returns the spinner instance.

#### action

Type: `Promise`


## Related

- [cli-spinners](https://github.com/sindresorhus/cli-spinners) - Spinners for use in the terminal
- [listr](https://github.com/SamVerschueren/listr) - Terminal task list
- [CLISpinner](https://github.com/kiliankoe/CLISpinner) - Terminal spinner library for Swift
- [halo](https://github.com/ManrajGrover/halo) - Python port
- [spinners](https://github.com/FGRibreau/spinners) - Terminal spinners for Rust
- [marquee-ora](https://github.com/joeycozza/marquee-ora) - Scrolling marquee spinner for Ora
- [briandowns/spinner](https://github.com/briandowns/spinner) - Terminal spinner/progress indicator for Go
- [tj/go-spin](https://github.com/tj/go-spin) - Terminal spinner package for Go


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
