function cov_z1t2zcrd2() {
  var path = "/Users/apple/github/appsmith/app/client/src/pages/Editor/SaaSEditor/constants.ts";
  var hash = "5f574ce60b8b26962687730c2f32b56b6e40d847";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/pages/Editor/SaaSEditor/constants.ts",
    statementMap: {
      "0": {
        start: {
          line: 1,
          column: 30
        },
        end: {
          line: 1,
          column: 37
        }
      },
      "1": {
        start: {
          line: 2,
          column: 32
        },
        end: {
          line: 2,
          column: 70
        }
      },
      "2": {
        start: {
          line: 3,
          column: 46
        },
        end: {
          line: 3,
          column: 93
        }
      },
      "3": {
        start: {
          line: 4,
          column: 39
        },
        end: {
          line: 4,
          column: 71
        }
      },
      "4": {
        start: {
          line: 6,
          column: 42
        },
        end: {
          line: 6,
          column: 63
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
      "4": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "5f574ce60b8b26962687730c2f32b56b6e40d847"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_z1t2zcrd2 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_z1t2zcrd2();
export const SAAS_BASE_PATH = (cov_z1t2zcrd2().s[0]++, `/saas`);
export const SAAS_EDITOR_PATH = (cov_z1t2zcrd2().s[1]++, `${SAAS_BASE_PATH}/:pluginPackageName`);
export const SAAS_EDITOR_DATASOURCE_ID_PATH = (cov_z1t2zcrd2().s[2]++, `${SAAS_EDITOR_PATH}/datasources/:datasourceId`);
export const SAAS_EDITOR_API_ID_PATH = (cov_z1t2zcrd2().s[3]++, `${SAAS_EDITOR_PATH}/api/:apiId`);
export const APPSMITH_TOKEN_STORAGE_KEY = (cov_z1t2zcrd2().s[4]++, "APPSMITH_AUTH_TOKEN");
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfejF0MnpjcmQyIiwiYWN0dWFsQ292ZXJhZ2UiLCJTQUFTX0JBU0VfUEFUSCIsInMiLCJTQUFTX0VESVRPUl9QQVRIIiwiU0FBU19FRElUT1JfREFUQVNPVVJDRV9JRF9QQVRIIiwiU0FBU19FRElUT1JfQVBJX0lEX1BBVEgiLCJBUFBTTUlUSF9UT0tFTl9TVE9SQUdFX0tFWSJdLCJzb3VyY2VzIjpbImNvbnN0YW50cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgU0FBU19CQVNFX1BBVEggPSBgL3NhYXNgO1xuZXhwb3J0IGNvbnN0IFNBQVNfRURJVE9SX1BBVEggPSBgJHtTQUFTX0JBU0VfUEFUSH0vOnBsdWdpblBhY2thZ2VOYW1lYDtcbmV4cG9ydCBjb25zdCBTQUFTX0VESVRPUl9EQVRBU09VUkNFX0lEX1BBVEggPSBgJHtTQUFTX0VESVRPUl9QQVRIfS9kYXRhc291cmNlcy86ZGF0YXNvdXJjZUlkYDtcbmV4cG9ydCBjb25zdCBTQUFTX0VESVRPUl9BUElfSURfUEFUSCA9IGAke1NBQVNfRURJVE9SX1BBVEh9L2FwaS86YXBpSWRgO1xuXG5leHBvcnQgY29uc3QgQVBQU01JVEhfVE9LRU5fU1RPUkFHRV9LRVkgPSBcIkFQUFNNSVRIX0FVVEhfVE9LRU5cIjtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGFBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGFBQUE7QUFmWixPQUFPLE1BQU1FLGNBQWMsSUFBQUYsYUFBQSxHQUFBRyxDQUFBLE9BQUksT0FBTTtBQUNyQyxPQUFPLE1BQU1DLGdCQUFnQixJQUFBSixhQUFBLEdBQUFHLENBQUEsT0FBSSxHQUFFRCxjQUFlLHFCQUFvQjtBQUN0RSxPQUFPLE1BQU1HLDhCQUE4QixJQUFBTCxhQUFBLEdBQUFHLENBQUEsT0FBSSxHQUFFQyxnQkFBaUIsNEJBQTJCO0FBQzdGLE9BQU8sTUFBTUUsdUJBQXVCLElBQUFOLGFBQUEsR0FBQUcsQ0FBQSxPQUFJLEdBQUVDLGdCQUFpQixhQUFZO0FBRXZFLE9BQU8sTUFBTUcsMEJBQTBCLElBQUFQLGFBQUEsR0FBQUcsQ0FBQSxPQUFHLHFCQUFxQiJ9