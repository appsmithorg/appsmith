function cov_2r5zeppuh() {
  var path = "/Users/apple/github/appsmith/app/client/src/ce/constants/UsagePulse.ts";
  var hash = "8e249b34004d4d24597beaa9e411fe3589c54d4c";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/ce/constants/UsagePulse.ts",
    statementMap: {
      "0": {
        start: {
          line: 1,
          column: 34
        },
        end: {
          line: 1,
          column: 55
        }
      },
      "1": {
        start: {
          line: 2,
          column: 30
        },
        end: {
          line: 2,
          column: 37
        }
      },
      "2": {
        start: {
          line: 3,
          column: 45
        },
        end: {
          line: 3,
          column: 71
        }
      },
      "3": {
        start: {
          line: 4,
          column: 28
        },
        end: {
          line: 4,
          column: 56
        }
      },
      "4": {
        start: {
          line: 5,
          column: 39
        },
        end: {
          line: 5,
          column: 43
        }
      },
      "5": {
        start: {
          line: 6,
          column: 41
        },
        end: {
          line: 6,
          column: 42
        }
      }
    },
    fnMap: {},
    branchMap: {},
    s: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "8e249b34004d4d24597beaa9e411fe3589c54d4c"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2r5zeppuh = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2r5zeppuh();
export const PULSE_API_ENDPOINT = (cov_2r5zeppuh().s[0]++, "/api/v1/usage-pulse");
export const PULSE_INTERVAL = (cov_2r5zeppuh().s[1]++, 3600000); /* 60 minutes in miliseconds */
export const USER_ACTIVITY_LISTENER_EVENTS = (cov_2r5zeppuh().s[2]++, ["pointerdown", "keydown"]);
export const FALLBACK_KEY = (cov_2r5zeppuh().s[3]++, "APPSMITH_ANONYMOUS_USER_ID");
export const PULSE_API_RETRY_TIMEOUT = (cov_2r5zeppuh().s[4]++, 2000); /*2 seconds  in miliseconds*/
export const PULSE_API_MAX_RETRY_COUNT = (cov_2r5zeppuh().s[5]++, 3);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMnI1emVwcHVoIiwiYWN0dWFsQ292ZXJhZ2UiLCJQVUxTRV9BUElfRU5EUE9JTlQiLCJzIiwiUFVMU0VfSU5URVJWQUwiLCJVU0VSX0FDVElWSVRZX0xJU1RFTkVSX0VWRU5UUyIsIkZBTExCQUNLX0tFWSIsIlBVTFNFX0FQSV9SRVRSWV9USU1FT1VUIiwiUFVMU0VfQVBJX01BWF9SRVRSWV9DT1VOVCJdLCJzb3VyY2VzIjpbIlVzYWdlUHVsc2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IFBVTFNFX0FQSV9FTkRQT0lOVCA9IFwiL2FwaS92MS91c2FnZS1wdWxzZVwiO1xuZXhwb3J0IGNvbnN0IFBVTFNFX0lOVEVSVkFMID0gMzYwMDAwMDsgLyogNjAgbWludXRlcyBpbiBtaWxpc2Vjb25kcyAqL1xuZXhwb3J0IGNvbnN0IFVTRVJfQUNUSVZJVFlfTElTVEVORVJfRVZFTlRTID0gW1wicG9pbnRlcmRvd25cIiwgXCJrZXlkb3duXCJdO1xuZXhwb3J0IGNvbnN0IEZBTExCQUNLX0tFWSA9IFwiQVBQU01JVEhfQU5PTllNT1VTX1VTRVJfSURcIjtcbmV4cG9ydCBjb25zdCBQVUxTRV9BUElfUkVUUllfVElNRU9VVCA9IDIwMDA7IC8qMiBzZWNvbmRzICBpbiBtaWxpc2Vjb25kcyovXG5leHBvcnQgY29uc3QgUFVMU0VfQVBJX01BWF9SRVRSWV9DT1VOVCA9IDM7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGFBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGFBQUE7QUFmWixPQUFPLE1BQU1FLGtCQUFrQixJQUFBRixhQUFBLEdBQUFHLENBQUEsT0FBRyxxQkFBcUI7QUFDdkQsT0FBTyxNQUFNQyxjQUFjLElBQUFKLGFBQUEsR0FBQUcsQ0FBQSxPQUFHLE9BQU8sRUFBQyxDQUFDO0FBQ3ZDLE9BQU8sTUFBTUUsNkJBQTZCLElBQUFMLGFBQUEsR0FBQUcsQ0FBQSxPQUFHLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQztBQUN2RSxPQUFPLE1BQU1HLFlBQVksSUFBQU4sYUFBQSxHQUFBRyxDQUFBLE9BQUcsNEJBQTRCO0FBQ3hELE9BQU8sTUFBTUksdUJBQXVCLElBQUFQLGFBQUEsR0FBQUcsQ0FBQSxPQUFHLElBQUksRUFBQyxDQUFDO0FBQzdDLE9BQU8sTUFBTUsseUJBQXlCLElBQUFSLGFBQUEsR0FBQUcsQ0FBQSxPQUFHLENBQUMifQ==