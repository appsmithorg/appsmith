function cov_2p39b7jhp6() {
  var path = "/Users/apple/github/appsmith/app/client/src/assets/icons/blueprintjs/svgo.config.js";
  var hash = "d9c7c6d7c75be6dafc9ebe5a7ab8d5e025df4379";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/assets/icons/blueprintjs/svgo.config.js",
    statementMap: {
      "0": {
        start: {
          line: 1,
          column: 0
        },
        end: {
          line: 24,
          column: 2
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
    hash: "d9c7c6d7c75be6dafc9ebe5a7ab8d5e025df4379"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2p39b7jhp6 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2p39b7jhp6();
cov_2p39b7jhp6().s[0]++;
module.exports = {
  plugins: [
  // Optimize SVG icons.
  // Most importantly, this removes namespace attributes like "xmlns:sketch"
  // that breaks the build with “Namespace tags are not supported by default”
  "preset-default",
  // Remove all fill or stroke attributes from SVGs, except for those that
  // are set to "none". This is necessary because we’re using raw SVGs from
  // the BlueprintJS repo, and they sometimes have incorrectly set fill or
  // stroke colors.
  //
  // @blueprintjs/icons doesn’t have this issue because it doesn’t actually
  // use raw SVGs – instead, it uses a custom build process that extracts
  // the paths from the SVGs and puts them all into a single file.
  // (https://github.com/palantir/blueprint/blob/release/3.x/packages/node-build-scripts/generate-icons-source.js)
  {
    name: "removeAttrs",
    params: {
      attrs: '(fill|stroke)(?!="none")'
    }
  }]
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMnAzOWI3amhwNiIsImFjdHVhbENvdmVyYWdlIiwicyIsIm1vZHVsZSIsImV4cG9ydHMiLCJwbHVnaW5zIiwibmFtZSIsInBhcmFtcyIsImF0dHJzIl0sInNvdXJjZXMiOlsic3Znby5jb25maWcuanMiXSwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSB7XG4gIHBsdWdpbnM6IFtcbiAgICAvLyBPcHRpbWl6ZSBTVkcgaWNvbnMuXG4gICAgLy8gTW9zdCBpbXBvcnRhbnRseSwgdGhpcyByZW1vdmVzIG5hbWVzcGFjZSBhdHRyaWJ1dGVzIGxpa2UgXCJ4bWxuczpza2V0Y2hcIlxuICAgIC8vIHRoYXQgYnJlYWtzIHRoZSBidWlsZCB3aXRoIOKAnE5hbWVzcGFjZSB0YWdzIGFyZSBub3Qgc3VwcG9ydGVkIGJ5IGRlZmF1bHTigJ1cbiAgICBcInByZXNldC1kZWZhdWx0XCIsXG5cbiAgICAvLyBSZW1vdmUgYWxsIGZpbGwgb3Igc3Ryb2tlIGF0dHJpYnV0ZXMgZnJvbSBTVkdzLCBleGNlcHQgZm9yIHRob3NlIHRoYXRcbiAgICAvLyBhcmUgc2V0IHRvIFwibm9uZVwiLiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHdl4oCZcmUgdXNpbmcgcmF3IFNWR3MgZnJvbVxuICAgIC8vIHRoZSBCbHVlcHJpbnRKUyByZXBvLCBhbmQgdGhleSBzb21ldGltZXMgaGF2ZSBpbmNvcnJlY3RseSBzZXQgZmlsbCBvclxuICAgIC8vIHN0cm9rZSBjb2xvcnMuXG4gICAgLy9cbiAgICAvLyBAYmx1ZXByaW50anMvaWNvbnMgZG9lc27igJl0IGhhdmUgdGhpcyBpc3N1ZSBiZWNhdXNlIGl0IGRvZXNu4oCZdCBhY3R1YWxseVxuICAgIC8vIHVzZSByYXcgU1ZHcyDigJMgaW5zdGVhZCwgaXQgdXNlcyBhIGN1c3RvbSBidWlsZCBwcm9jZXNzIHRoYXQgZXh0cmFjdHNcbiAgICAvLyB0aGUgcGF0aHMgZnJvbSB0aGUgU1ZHcyBhbmQgcHV0cyB0aGVtIGFsbCBpbnRvIGEgc2luZ2xlIGZpbGUuXG4gICAgLy8gKGh0dHBzOi8vZ2l0aHViLmNvbS9wYWxhbnRpci9ibHVlcHJpbnQvYmxvYi9yZWxlYXNlLzMueC9wYWNrYWdlcy9ub2RlLWJ1aWxkLXNjcmlwdHMvZ2VuZXJhdGUtaWNvbnMtc291cmNlLmpzKVxuICAgIHtcbiAgICAgIG5hbWU6IFwicmVtb3ZlQXR0cnNcIixcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBhdHRyczogJyhmaWxsfHN0cm9rZSkoPyE9XCJub25lXCIpJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgXSxcbn07XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQUFBQSxjQUFBLEdBQUFFLENBQUE7QUFmWkMsTUFBTSxDQUFDQyxPQUFPLEdBQUc7RUFDZkMsT0FBTyxFQUFFO0VBQ1A7RUFDQTtFQUNBO0VBQ0EsZ0JBQWdCO0VBRWhCO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0lBQ0VDLElBQUksRUFBRSxhQUFhO0lBQ25CQyxNQUFNLEVBQUU7TUFDTkMsS0FBSyxFQUFFO0lBQ1Q7RUFDRixDQUFDO0FBRUwsQ0FBQyJ9