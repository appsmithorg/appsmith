function cov_2pwknp5r8x() {
  var path = "/Users/apple/github/appsmith/app/client/src/ee/sagas/tenantSagas.tsx";
  var hash = "4b00a0ad33deb9d0b3c0cc70abf23e55e6b04619";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/ee/sagas/tenantSagas.tsx",
    statementMap: {
      "0": {
        start: {
          line: 10,
          column: 2
        },
        end: {
          line: 16,
          column: 5
        }
      }
    },
    fnMap: {
      "0": {
        name: "tenantSagas",
        decl: {
          start: {
            line: 9,
            column: 25
          },
          end: {
            line: 9,
            column: 36
          }
        },
        loc: {
          start: {
            line: 9,
            column: 39
          },
          end: {
            line: 17,
            column: 1
          }
        },
        line: 9
      }
    },
    branchMap: {},
    s: {
      "0": 0
    },
    f: {
      "0": 0
    },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "4b00a0ad33deb9d0b3c0cc70abf23e55e6b04619"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2pwknp5r8x = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2pwknp5r8x();
export * from "ce/sagas/tenantSagas";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { fetchCurrentTenantConfigSaga, updateTenantConfigSaga } from "ce/sagas/tenantSagas";
import { all, takeLatest } from "redux-saga/effects";
export default function* tenantSagas() {
  cov_2pwknp5r8x().f[0]++;
  cov_2pwknp5r8x().s[0]++;
  yield all([takeLatest(ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG, fetchCurrentTenantConfigSaga), takeLatest(ReduxActionTypes.UPDATE_TENANT_CONFIG, updateTenantConfigSaga)]);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMnB3a25wNXI4eCIsImFjdHVhbENvdmVyYWdlIiwiUmVkdXhBY3Rpb25UeXBlcyIsImZldGNoQ3VycmVudFRlbmFudENvbmZpZ1NhZ2EiLCJ1cGRhdGVUZW5hbnRDb25maWdTYWdhIiwiYWxsIiwidGFrZUxhdGVzdCIsInRlbmFudFNhZ2FzIiwiZiIsInMiLCJGRVRDSF9DVVJSRU5UX1RFTkFOVF9DT05GSUciLCJVUERBVEVfVEVOQU5UX0NPTkZJRyJdLCJzb3VyY2VzIjpbInRlbmFudFNhZ2FzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgKiBmcm9tIFwiY2Uvc2FnYXMvdGVuYW50U2FnYXNcIjtcbmltcG9ydCB7IFJlZHV4QWN0aW9uVHlwZXMgfSBmcm9tIFwiQGFwcHNtaXRoL2NvbnN0YW50cy9SZWR1eEFjdGlvbkNvbnN0YW50c1wiO1xuaW1wb3J0IHtcbiAgZmV0Y2hDdXJyZW50VGVuYW50Q29uZmlnU2FnYSxcbiAgdXBkYXRlVGVuYW50Q29uZmlnU2FnYSxcbn0gZnJvbSBcImNlL3NhZ2FzL3RlbmFudFNhZ2FzXCI7XG5pbXBvcnQgeyBhbGwsIHRha2VMYXRlc3QgfSBmcm9tIFwicmVkdXgtc2FnYS9lZmZlY3RzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKiB0ZW5hbnRTYWdhcygpIHtcbiAgeWllbGQgYWxsKFtcbiAgICB0YWtlTGF0ZXN0KFxuICAgICAgUmVkdXhBY3Rpb25UeXBlcy5GRVRDSF9DVVJSRU5UX1RFTkFOVF9DT05GSUcsXG4gICAgICBmZXRjaEN1cnJlbnRUZW5hbnRDb25maWdTYWdhLFxuICAgICksXG4gICAgdGFrZUxhdGVzdChSZWR1eEFjdGlvblR5cGVzLlVQREFURV9URU5BTlRfQ09ORklHLCB1cGRhdGVUZW5hbnRDb25maWdTYWdhKSxcbiAgXSk7XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLGNBQWMsc0JBQXNCO0FBQ3BDLFNBQVNFLGdCQUFnQixRQUFRLDBDQUEwQztBQUMzRSxTQUNFQyw0QkFBNEIsRUFDNUJDLHNCQUFzQixRQUNqQixzQkFBc0I7QUFDN0IsU0FBU0MsR0FBRyxFQUFFQyxVQUFVLFFBQVEsb0JBQW9CO0FBRXBELGVBQWUsVUFBVUMsV0FBV0EsQ0FBQSxFQUFHO0VBQUFQLGNBQUEsR0FBQVEsQ0FBQTtFQUFBUixjQUFBLEdBQUFTLENBQUE7RUFDckMsTUFBTUosR0FBRyxDQUFDLENBQ1JDLFVBQVUsQ0FDUkosZ0JBQWdCLENBQUNRLDJCQUEyQixFQUM1Q1AsNEJBQ0YsQ0FBQyxFQUNERyxVQUFVLENBQUNKLGdCQUFnQixDQUFDUyxvQkFBb0IsRUFBRVAsc0JBQXNCLENBQUMsQ0FDMUUsQ0FBQztBQUNKIn0=