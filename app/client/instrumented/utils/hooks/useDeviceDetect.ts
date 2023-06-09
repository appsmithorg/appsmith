function cov_280uzz9ong() {
  var path = "/Users/apple/github/appsmith/app/client/src/utils/hooks/useDeviceDetect.ts";
  var hash = "0a4404a8f179757de4284cfc485b4dbd84a9b6fc";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/utils/hooks/useDeviceDetect.ts",
    statementMap: {
      "0": {
        start: {
          line: 10,
          column: 2
        },
        end: {
          line: 10,
          column: 55
        }
      },
      "1": {
        start: {
          line: 14,
          column: 2
        },
        end: {
          line: 17,
          column: 5
        }
      },
      "2": {
        start: {
          line: 21,
          column: 2
        },
        end: {
          line: 23,
          column: 5
        }
      }
    },
    fnMap: {
      "0": {
        name: "useIsMobileDevice",
        decl: {
          start: {
            line: 9,
            column: 16
          },
          end: {
            line: 9,
            column: 33
          }
        },
        loc: {
          start: {
            line: 9,
            column: 36
          },
          end: {
            line: 11,
            column: 1
          }
        },
        line: 9
      },
      "1": {
        name: "useIsTabletDevice",
        decl: {
          start: {
            line: 13,
            column: 16
          },
          end: {
            line: 13,
            column: 33
          }
        },
        loc: {
          start: {
            line: 13,
            column: 36
          },
          end: {
            line: 18,
            column: 1
          }
        },
        line: 13
      },
      "2": {
        name: "useIsDesktopDevice",
        decl: {
          start: {
            line: 20,
            column: 16
          },
          end: {
            line: 20,
            column: 34
          }
        },
        loc: {
          start: {
            line: 20,
            column: 37
          },
          end: {
            line: 24,
            column: 1
          }
        },
        line: 20
      }
    },
    branchMap: {},
    s: {
      "0": 0,
      "1": 0,
      "2": 0
    },
    f: {
      "0": 0,
      "1": 0,
      "2": 0
    },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "0a4404a8f179757de4284cfc485b4dbd84a9b6fc"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_280uzz9ong = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_280uzz9ong();
import { useMediaQuery } from "react-responsive";
import { MOBILE_MAX_WIDTH, TABLET_MIN_WIDTH, TABLET_MAX_WIDTH, DESKTOP_MIN_WIDTH } from "constants/AppConstants";
export function useIsMobileDevice() {
  cov_280uzz9ong().f[0]++;
  cov_280uzz9ong().s[0]++;
  return useMediaQuery({
    maxWidth: MOBILE_MAX_WIDTH
  });
}
export function useIsTabletDevice() {
  cov_280uzz9ong().f[1]++;
  cov_280uzz9ong().s[1]++;
  return useMediaQuery({
    minWidth: TABLET_MIN_WIDTH,
    maxWidth: TABLET_MAX_WIDTH
  });
}
export function useIsDesktopDevice() {
  cov_280uzz9ong().f[2]++;
  cov_280uzz9ong().s[2]++;
  return useMediaQuery({
    minWidth: DESKTOP_MIN_WIDTH
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMjgwdXp6OW9uZyIsImFjdHVhbENvdmVyYWdlIiwidXNlTWVkaWFRdWVyeSIsIk1PQklMRV9NQVhfV0lEVEgiLCJUQUJMRVRfTUlOX1dJRFRIIiwiVEFCTEVUX01BWF9XSURUSCIsIkRFU0tUT1BfTUlOX1dJRFRIIiwidXNlSXNNb2JpbGVEZXZpY2UiLCJmIiwicyIsIm1heFdpZHRoIiwidXNlSXNUYWJsZXREZXZpY2UiLCJtaW5XaWR0aCIsInVzZUlzRGVza3RvcERldmljZSJdLCJzb3VyY2VzIjpbInVzZURldmljZURldGVjdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VNZWRpYVF1ZXJ5IH0gZnJvbSBcInJlYWN0LXJlc3BvbnNpdmVcIjtcbmltcG9ydCB7XG4gIE1PQklMRV9NQVhfV0lEVEgsXG4gIFRBQkxFVF9NSU5fV0lEVEgsXG4gIFRBQkxFVF9NQVhfV0lEVEgsXG4gIERFU0tUT1BfTUlOX1dJRFRILFxufSBmcm9tIFwiY29uc3RhbnRzL0FwcENvbnN0YW50c1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gdXNlSXNNb2JpbGVEZXZpY2UoKSB7XG4gIHJldHVybiB1c2VNZWRpYVF1ZXJ5KHsgbWF4V2lkdGg6IE1PQklMRV9NQVhfV0lEVEggfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VJc1RhYmxldERldmljZSgpIHtcbiAgcmV0dXJuIHVzZU1lZGlhUXVlcnkoe1xuICAgIG1pbldpZHRoOiBUQUJMRVRfTUlOX1dJRFRILFxuICAgIG1heFdpZHRoOiBUQUJMRVRfTUFYX1dJRFRILFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVzZUlzRGVza3RvcERldmljZSgpIHtcbiAgcmV0dXJuIHVzZU1lZGlhUXVlcnkoe1xuICAgIG1pbldpZHRoOiBERVNLVE9QX01JTl9XSURUSCxcbiAgfSk7XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLFNBQVNFLGFBQWEsUUFBUSxrQkFBa0I7QUFDaEQsU0FDRUMsZ0JBQWdCLEVBQ2hCQyxnQkFBZ0IsRUFDaEJDLGdCQUFnQixFQUNoQkMsaUJBQWlCLFFBQ1osd0JBQXdCO0FBRS9CLE9BQU8sU0FBU0MsaUJBQWlCQSxDQUFBLEVBQUc7RUFBQVAsY0FBQSxHQUFBUSxDQUFBO0VBQUFSLGNBQUEsR0FBQVMsQ0FBQTtFQUNsQyxPQUFPUCxhQUFhLENBQUM7SUFBRVEsUUFBUSxFQUFFUDtFQUFpQixDQUFDLENBQUM7QUFDdEQ7QUFFQSxPQUFPLFNBQVNRLGlCQUFpQkEsQ0FBQSxFQUFHO0VBQUFYLGNBQUEsR0FBQVEsQ0FBQTtFQUFBUixjQUFBLEdBQUFTLENBQUE7RUFDbEMsT0FBT1AsYUFBYSxDQUFDO0lBQ25CVSxRQUFRLEVBQUVSLGdCQUFnQjtJQUMxQk0sUUFBUSxFQUFFTDtFQUNaLENBQUMsQ0FBQztBQUNKO0FBRUEsT0FBTyxTQUFTUSxrQkFBa0JBLENBQUEsRUFBRztFQUFBYixjQUFBLEdBQUFRLENBQUE7RUFBQVIsY0FBQSxHQUFBUyxDQUFBO0VBQ25DLE9BQU9QLGFBQWEsQ0FBQztJQUNuQlUsUUFBUSxFQUFFTjtFQUNaLENBQUMsQ0FBQztBQUNKIn0=