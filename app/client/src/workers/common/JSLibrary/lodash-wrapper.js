// We use babel-plugin-lodash to only import the lodash functions we use.
// Unfortunately, the plugin doesn’t work with the following pattern:
//   import _ from 'lodash';
//   const something = _;
// When it encounters code like above, it will replace _ with `undefined`,
// which will break the app.
//
// Given that we *need* to use the full lodash in ./resetJSLibraries.js,
// we use this workaround where we’re importing Lodash using CommonJS require().
// It works because babel-plugin-lodash doesn’t support CommonJS require().
module.exports = require("lodash");
