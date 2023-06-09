function cov_salivnfty() {
  var path = "/Users/apple/github/appsmith/app/client/src/constants/GitErrorCodes.ts";
  var hash = "bcab2e4055254f5581d5df94396775796f62bc28";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/constants/GitErrorCodes.ts",
    statementMap: {
      "0": {
        start: {
          line: 1,
          column: 24
        },
        end: {
          line: 4,
          column: 1
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
    hash: "bcab2e4055254f5581d5df94396775796f62bc28"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_salivnfty = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_salivnfty();
const GIT_ERROR_CODES = (cov_salivnfty().s[0]++, {
  PRIVATE_REPO_CONNECTIONS_LIMIT_REACHED: "AE-GIT-4043",
  PUSH_FAILED_REMOTE_COUNTERPART_IS_AHEAD: "AE-GIT-4048"
});
export default GIT_ERROR_CODES;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3Zfc2FsaXZuZnR5IiwiYWN0dWFsQ292ZXJhZ2UiLCJHSVRfRVJST1JfQ09ERVMiLCJzIiwiUFJJVkFURV9SRVBPX0NPTk5FQ1RJT05TX0xJTUlUX1JFQUNIRUQiLCJQVVNIX0ZBSUxFRF9SRU1PVEVfQ09VTlRFUlBBUlRfSVNfQUhFQUQiXSwic291cmNlcyI6WyJHaXRFcnJvckNvZGVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IEdJVF9FUlJPUl9DT0RFUyA9IHtcbiAgUFJJVkFURV9SRVBPX0NPTk5FQ1RJT05TX0xJTUlUX1JFQUNIRUQ6IFwiQUUtR0lULTQwNDNcIixcbiAgUFVTSF9GQUlMRURfUkVNT1RFX0NPVU5URVJQQVJUX0lTX0FIRUFEOiBcIkFFLUdJVC00MDQ4XCIsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBHSVRfRVJST1JfQ09ERVM7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsYUFBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsYUFBQTtBQWZaLE1BQU1FLGVBQWUsSUFBQUYsYUFBQSxHQUFBRyxDQUFBLE9BQUc7RUFDdEJDLHNDQUFzQyxFQUFFLGFBQWE7RUFDckRDLHVDQUF1QyxFQUFFO0FBQzNDLENBQUM7QUFFRCxlQUFlSCxlQUFlIn0=