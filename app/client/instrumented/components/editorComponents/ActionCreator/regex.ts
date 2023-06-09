function cov_x8p7pgkrv() {
  var path = "/Users/apple/github/appsmith/app/client/src/components/editorComponents/ActionCreator/regex.ts";
  var hash = "d46a3269121c7774ee39a2b2b24e3edc810e381b";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/components/editorComponents/ActionCreator/regex.ts",
    statementMap: {
      "0": {
        start: {
          line: 2,
          column: 2
        },
        end: {
          line: 2,
          column: 136
        }
      },
      "1": {
        start: {
          line: 5,
          column: 36
        },
        end: {
          line: 5,
          column: 69
        }
      },
      "2": {
        start: {
          line: 8,
          column: 2
        },
        end: {
          line: 8,
          column: 52
        }
      },
      "3": {
        start: {
          line: 10,
          column: 31
        },
        end: {
          line: 10,
          column: 39
        }
      }
    },
    fnMap: {},
    branchMap: {},
    s: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "d46a3269121c7774ee39a2b2b24e3edc810e381b"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_x8p7pgkrv = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_x8p7pgkrv();
export const FUNC_ARGS_REGEX = (cov_x8p7pgkrv().s[0]++, /((["][^"]*["])|([\[][\s\S]*[\]])|([\{][\s\S]*[\}])|(['][^']*['])|([\(][\s\S]*[\)][ ]*=>[ ]*[{][\s\S]*[}])|([^'",][^,"+]*[^'",]*))*/gi);

//Old Regex:: /\(\) => ([\s\S]*?)(\([\s\S]*?\))/g;
export const ACTION_TRIGGER_REGEX = (cov_x8p7pgkrv().s[1]++, /^{{([\s\S]*?)\(([\s\S]*?)\)}}$/g);
export const ACTION_ANONYMOUS_FUNC_REGEX = (cov_x8p7pgkrv().s[2]++, /\(\) => (({[\s\S]*?})|([\s\S]*?)(\([\s\S]*?\)))/g);
export const IS_URL_OR_MODAL = (cov_x8p7pgkrv().s[3]++, /^'.*'$/);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfeDhwN3Bna3J2IiwiYWN0dWFsQ292ZXJhZ2UiLCJGVU5DX0FSR1NfUkVHRVgiLCJzIiwiQUNUSU9OX1RSSUdHRVJfUkVHRVgiLCJBQ1RJT05fQU5PTllNT1VTX0ZVTkNfUkVHRVgiLCJJU19VUkxfT1JfTU9EQUwiXSwic291cmNlcyI6WyJyZWdleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgRlVOQ19BUkdTX1JFR0VYID1cbiAgLygoW1wiXVteXCJdKltcIl0pfChbXFxbXVtcXHNcXFNdKltcXF1dKXwoW1xce11bXFxzXFxTXSpbXFx9XSl8KFsnXVteJ10qWyddKXwoW1xcKF1bXFxzXFxTXSpbXFwpXVsgXSo9PlsgXSpbe11bXFxzXFxTXSpbfV0pfChbXidcIixdW14sXCIrXSpbXidcIixdKikpKi9naTtcblxuLy9PbGQgUmVnZXg6OiAvXFwoXFwpID0+IChbXFxzXFxTXSo/KShcXChbXFxzXFxTXSo/XFwpKS9nO1xuZXhwb3J0IGNvbnN0IEFDVElPTl9UUklHR0VSX1JFR0VYID0gL157eyhbXFxzXFxTXSo/KVxcKChbXFxzXFxTXSo/KVxcKX19JC9nO1xuXG5leHBvcnQgY29uc3QgQUNUSU9OX0FOT05ZTU9VU19GVU5DX1JFR0VYID1cbiAgL1xcKFxcKSA9PiAoKHtbXFxzXFxTXSo/fSl8KFtcXHNcXFNdKj8pKFxcKFtcXHNcXFNdKj9cXCkpKS9nO1xuXG5leHBvcnQgY29uc3QgSVNfVVJMX09SX01PREFMID0gL14nLionJC87XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsYUFBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsYUFBQTtBQWZaLE9BQU8sTUFBTUUsZUFBZSxJQUFBRixhQUFBLEdBQUFHLENBQUEsT0FDMUIsc0lBQXNJOztBQUV4STtBQUNBLE9BQU8sTUFBTUMsb0JBQW9CLElBQUFKLGFBQUEsR0FBQUcsQ0FBQSxPQUFHLGlDQUFpQztBQUVyRSxPQUFPLE1BQU1FLDJCQUEyQixJQUFBTCxhQUFBLEdBQUFHLENBQUEsT0FDdEMsa0RBQWtEO0FBRXBELE9BQU8sTUFBTUcsZUFBZSxJQUFBTixhQUFBLEdBQUFHLENBQUEsT0FBRyxRQUFRIn0=