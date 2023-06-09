function cov_d9dzy008e() {
  var path = "/Users/apple/github/appsmith/app/client/src/constants/Regex.ts";
  var hash = "b62d2657e2b52a133befa7467e1264a858836055";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/constants/Regex.ts",
    statementMap: {
      "0": {
        start: {
          line: 5,
          column: 45
        },
        end: {
          line: 5,
          column: 52
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
    hash: "b62d2657e2b52a133befa7467e1264a858836055"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_d9dzy008e = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_d9dzy008e();
import pL from "js-regex-pl";

/* ref: https://github.com/yury-dymov/js-regex-pl/blob/master/src/index.js
 includes support for other languages (e.g. latin, chinese, japanese etc..) */
export const ALL_LANGUAGE_CHARACTERS_REGEX = (cov_d9dzy008e().s[0]++, `${pL}`);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfZDlkenkwMDhlIiwiYWN0dWFsQ292ZXJhZ2UiLCJwTCIsIkFMTF9MQU5HVUFHRV9DSEFSQUNURVJTX1JFR0VYIiwicyJdLCJzb3VyY2VzIjpbIlJlZ2V4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwTCBmcm9tIFwianMtcmVnZXgtcGxcIjtcblxuLyogcmVmOiBodHRwczovL2dpdGh1Yi5jb20veXVyeS1keW1vdi9qcy1yZWdleC1wbC9ibG9iL21hc3Rlci9zcmMvaW5kZXguanNcbiBpbmNsdWRlcyBzdXBwb3J0IGZvciBvdGhlciBsYW5ndWFnZXMgKGUuZy4gbGF0aW4sIGNoaW5lc2UsIGphcGFuZXNlIGV0Yy4uKSAqL1xuZXhwb3J0IGNvbnN0IEFMTF9MQU5HVUFHRV9DSEFSQUNURVJTX1JFR0VYID0gYCR7cEx9YDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxhQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxhQUFBO0FBZlosT0FBT0UsRUFBRSxNQUFNLGFBQWE7O0FBRTVCO0FBQ0E7QUFDQSxPQUFPLE1BQU1DLDZCQUE2QixJQUFBSCxhQUFBLEdBQUFJLENBQUEsT0FBSSxHQUFFRixFQUFHLEVBQUMifQ==