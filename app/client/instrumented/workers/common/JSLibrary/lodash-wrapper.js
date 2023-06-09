function cov_23wmqzj82b() {
  var path = "/Users/apple/github/appsmith/app/client/src/workers/common/JSLibrary/lodash-wrapper.js";
  var hash = "7089c43384fb15727eb9f053d4a9fb1c90b7ba68";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/workers/common/JSLibrary/lodash-wrapper.js",
    statementMap: {
      "0": {
        start: {
          line: 11,
          column: 0
        },
        end: {
          line: 11,
          column: 35
        }
      }
    },
    fnMap: {},
    branchMap: {},
    s: {
      "0": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "7089c43384fb15727eb9f053d4a9fb1c90b7ba68"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_23wmqzj82b = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_23wmqzj82b();
cov_23wmqzj82b().s[0]++;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMjN3bXF6ajgyYiIsImFjdHVhbENvdmVyYWdlIiwicyIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXF1aXJlIl0sInNvdXJjZXMiOlsibG9kYXNoLXdyYXBwZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gV2UgdXNlIGJhYmVsLXBsdWdpbi1sb2Rhc2ggdG8gb25seSBpbXBvcnQgdGhlIGxvZGFzaCBmdW5jdGlvbnMgd2UgdXNlLlxuLy8gVW5mb3J0dW5hdGVseSwgdGhlIHBsdWdpbiBkb2VzbuKAmXQgd29yayB3aXRoIHRoZSBmb2xsb3dpbmcgcGF0dGVybjpcbi8vICAgaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbi8vICAgY29uc3Qgc29tZXRoaW5nID0gXztcbi8vIFdoZW4gaXQgZW5jb3VudGVycyBjb2RlIGxpa2UgYWJvdmUsIGl0IHdpbGwgcmVwbGFjZSBfIHdpdGggYHVuZGVmaW5lZGAsXG4vLyB3aGljaCB3aWxsIGJyZWFrIHRoZSBhcHAuXG4vL1xuLy8gR2l2ZW4gdGhhdCB3ZSAqbmVlZCogdG8gdXNlIHRoZSBmdWxsIGxvZGFzaCBpbiAuL3Jlc2V0SlNMaWJyYXJpZXMuanMsXG4vLyB3ZSB1c2UgdGhpcyB3b3JrYXJvdW5kIHdoZXJlIHdl4oCZcmUgaW1wb3J0aW5nIExvZGFzaCB1c2luZyBDb21tb25KUyByZXF1aXJlKCkuXG4vLyBJdCB3b3JrcyBiZWNhdXNlIGJhYmVsLXBsdWdpbi1sb2Rhc2ggZG9lc27igJl0IHN1cHBvcnQgQ29tbW9uSlMgcmVxdWlyZSgpLlxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwibG9kYXNoXCIpO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFBQUEsY0FBQSxHQUFBRSxDQUFBO0FBZlo7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQUMsTUFBTSxDQUFDQyxPQUFPLEdBQUdDLE9BQU8sQ0FBQyxRQUFRLENBQUMifQ==