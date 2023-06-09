function cov_140yu0oxr1() {
  var path = "/Users/apple/github/appsmith/app/client/src/ee/sagas/WorkspaceSagas.ts";
  var hash = "90ad8aa3277db8924256616466796eb591234045";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/ee/sagas/WorkspaceSagas.ts",
    statementMap: {
      "0": {
        start: {
          line: 19,
          column: 2
        },
        end: {
          line: 37,
          column: 5
        }
      }
    },
    fnMap: {
      "0": {
        name: "workspaceSagas",
        decl: {
          start: {
            line: 18,
            column: 25
          },
          end: {
            line: 18,
            column: 39
          }
        },
        loc: {
          start: {
            line: 18,
            column: 42
          },
          end: {
            line: 38,
            column: 1
          }
        },
        line: 18
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
    hash: "90ad8aa3277db8924256616466796eb591234045"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_140yu0oxr1 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_140yu0oxr1();
export * from "ce/sagas/WorkspaceSagas";
import { fetchRolesSaga, fetchWorkspaceSaga, saveWorkspaceSaga, createWorkspaceSaga, fetchAllUsersSaga, fetchAllRolesSaga, deleteWorkspaceUserSaga, changeWorkspaceUserRoleSaga, deleteWorkspaceSaga, uploadWorkspaceLogoSaga, deleteWorkspaceLogoSaga } from "ce/sagas/WorkspaceSagas";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { all, takeLatest } from "redux-saga/effects";
export default function* workspaceSagas() {
  cov_140yu0oxr1().f[0]++;
  cov_140yu0oxr1().s[0]++;
  yield all([takeLatest(ReduxActionTypes.FETCH_WORKSPACE_ROLES_INIT, fetchRolesSaga), takeLatest(ReduxActionTypes.FETCH_CURRENT_WORKSPACE, fetchWorkspaceSaga), takeLatest(ReduxActionTypes.SAVE_WORKSPACE_INIT, saveWorkspaceSaga), takeLatest(ReduxActionTypes.CREATE_WORKSPACE_INIT, createWorkspaceSaga), takeLatest(ReduxActionTypes.FETCH_ALL_USERS_INIT, fetchAllUsersSaga), takeLatest(ReduxActionTypes.FETCH_ALL_ROLES_INIT, fetchAllRolesSaga), takeLatest(ReduxActionTypes.DELETE_WORKSPACE_USER_INIT, deleteWorkspaceUserSaga), takeLatest(ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_INIT, changeWorkspaceUserRoleSaga), takeLatest(ReduxActionTypes.DELETE_WORKSPACE_INIT, deleteWorkspaceSaga), takeLatest(ReduxActionTypes.UPLOAD_WORKSPACE_LOGO, uploadWorkspaceLogoSaga), takeLatest(ReduxActionTypes.REMOVE_WORKSPACE_LOGO, deleteWorkspaceLogoSaga)]);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMTQweXUwb3hyMSIsImFjdHVhbENvdmVyYWdlIiwiZmV0Y2hSb2xlc1NhZ2EiLCJmZXRjaFdvcmtzcGFjZVNhZ2EiLCJzYXZlV29ya3NwYWNlU2FnYSIsImNyZWF0ZVdvcmtzcGFjZVNhZ2EiLCJmZXRjaEFsbFVzZXJzU2FnYSIsImZldGNoQWxsUm9sZXNTYWdhIiwiZGVsZXRlV29ya3NwYWNlVXNlclNhZ2EiLCJjaGFuZ2VXb3Jrc3BhY2VVc2VyUm9sZVNhZ2EiLCJkZWxldGVXb3Jrc3BhY2VTYWdhIiwidXBsb2FkV29ya3NwYWNlTG9nb1NhZ2EiLCJkZWxldGVXb3Jrc3BhY2VMb2dvU2FnYSIsIlJlZHV4QWN0aW9uVHlwZXMiLCJhbGwiLCJ0YWtlTGF0ZXN0Iiwid29ya3NwYWNlU2FnYXMiLCJmIiwicyIsIkZFVENIX1dPUktTUEFDRV9ST0xFU19JTklUIiwiRkVUQ0hfQ1VSUkVOVF9XT1JLU1BBQ0UiLCJTQVZFX1dPUktTUEFDRV9JTklUIiwiQ1JFQVRFX1dPUktTUEFDRV9JTklUIiwiRkVUQ0hfQUxMX1VTRVJTX0lOSVQiLCJGRVRDSF9BTExfUk9MRVNfSU5JVCIsIkRFTEVURV9XT1JLU1BBQ0VfVVNFUl9JTklUIiwiQ0hBTkdFX1dPUktTUEFDRV9VU0VSX1JPTEVfSU5JVCIsIkRFTEVURV9XT1JLU1BBQ0VfSU5JVCIsIlVQTE9BRF9XT1JLU1BBQ0VfTE9HTyIsIlJFTU9WRV9XT1JLU1BBQ0VfTE9HTyJdLCJzb3VyY2VzIjpbIldvcmtzcGFjZVNhZ2FzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCAqIGZyb20gXCJjZS9zYWdhcy9Xb3Jrc3BhY2VTYWdhc1wiO1xuaW1wb3J0IHtcbiAgZmV0Y2hSb2xlc1NhZ2EsXG4gIGZldGNoV29ya3NwYWNlU2FnYSxcbiAgc2F2ZVdvcmtzcGFjZVNhZ2EsXG4gIGNyZWF0ZVdvcmtzcGFjZVNhZ2EsXG4gIGZldGNoQWxsVXNlcnNTYWdhLFxuICBmZXRjaEFsbFJvbGVzU2FnYSxcbiAgZGVsZXRlV29ya3NwYWNlVXNlclNhZ2EsXG4gIGNoYW5nZVdvcmtzcGFjZVVzZXJSb2xlU2FnYSxcbiAgZGVsZXRlV29ya3NwYWNlU2FnYSxcbiAgdXBsb2FkV29ya3NwYWNlTG9nb1NhZ2EsXG4gIGRlbGV0ZVdvcmtzcGFjZUxvZ29TYWdhLFxufSBmcm9tIFwiY2Uvc2FnYXMvV29ya3NwYWNlU2FnYXNcIjtcbmltcG9ydCB7IFJlZHV4QWN0aW9uVHlwZXMgfSBmcm9tIFwiQGFwcHNtaXRoL2NvbnN0YW50cy9SZWR1eEFjdGlvbkNvbnN0YW50c1wiO1xuaW1wb3J0IHsgYWxsLCB0YWtlTGF0ZXN0IH0gZnJvbSBcInJlZHV4LXNhZ2EvZWZmZWN0c1wiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiogd29ya3NwYWNlU2FnYXMoKSB7XG4gIHlpZWxkIGFsbChbXG4gICAgdGFrZUxhdGVzdChSZWR1eEFjdGlvblR5cGVzLkZFVENIX1dPUktTUEFDRV9ST0xFU19JTklULCBmZXRjaFJvbGVzU2FnYSksXG4gICAgdGFrZUxhdGVzdChSZWR1eEFjdGlvblR5cGVzLkZFVENIX0NVUlJFTlRfV09SS1NQQUNFLCBmZXRjaFdvcmtzcGFjZVNhZ2EpLFxuICAgIHRha2VMYXRlc3QoUmVkdXhBY3Rpb25UeXBlcy5TQVZFX1dPUktTUEFDRV9JTklULCBzYXZlV29ya3NwYWNlU2FnYSksXG4gICAgdGFrZUxhdGVzdChSZWR1eEFjdGlvblR5cGVzLkNSRUFURV9XT1JLU1BBQ0VfSU5JVCwgY3JlYXRlV29ya3NwYWNlU2FnYSksXG4gICAgdGFrZUxhdGVzdChSZWR1eEFjdGlvblR5cGVzLkZFVENIX0FMTF9VU0VSU19JTklULCBmZXRjaEFsbFVzZXJzU2FnYSksXG4gICAgdGFrZUxhdGVzdChSZWR1eEFjdGlvblR5cGVzLkZFVENIX0FMTF9ST0xFU19JTklULCBmZXRjaEFsbFJvbGVzU2FnYSksXG4gICAgdGFrZUxhdGVzdChcbiAgICAgIFJlZHV4QWN0aW9uVHlwZXMuREVMRVRFX1dPUktTUEFDRV9VU0VSX0lOSVQsXG4gICAgICBkZWxldGVXb3Jrc3BhY2VVc2VyU2FnYSxcbiAgICApLFxuICAgIHRha2VMYXRlc3QoXG4gICAgICBSZWR1eEFjdGlvblR5cGVzLkNIQU5HRV9XT1JLU1BBQ0VfVVNFUl9ST0xFX0lOSVQsXG4gICAgICBjaGFuZ2VXb3Jrc3BhY2VVc2VyUm9sZVNhZ2EsXG4gICAgKSxcbiAgICB0YWtlTGF0ZXN0KFJlZHV4QWN0aW9uVHlwZXMuREVMRVRFX1dPUktTUEFDRV9JTklULCBkZWxldGVXb3Jrc3BhY2VTYWdhKSxcbiAgICB0YWtlTGF0ZXN0KFJlZHV4QWN0aW9uVHlwZXMuVVBMT0FEX1dPUktTUEFDRV9MT0dPLCB1cGxvYWRXb3Jrc3BhY2VMb2dvU2FnYSksXG4gICAgdGFrZUxhdGVzdChSZWR1eEFjdGlvblR5cGVzLlJFTU9WRV9XT1JLU1BBQ0VfTE9HTywgZGVsZXRlV29ya3NwYWNlTG9nb1NhZ2EpLFxuICBdKTtcbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosY0FBYyx5QkFBeUI7QUFDdkMsU0FDRUUsY0FBYyxFQUNkQyxrQkFBa0IsRUFDbEJDLGlCQUFpQixFQUNqQkMsbUJBQW1CLEVBQ25CQyxpQkFBaUIsRUFDakJDLGlCQUFpQixFQUNqQkMsdUJBQXVCLEVBQ3ZCQywyQkFBMkIsRUFDM0JDLG1CQUFtQixFQUNuQkMsdUJBQXVCLEVBQ3ZCQyx1QkFBdUIsUUFDbEIseUJBQXlCO0FBQ2hDLFNBQVNDLGdCQUFnQixRQUFRLDBDQUEwQztBQUMzRSxTQUFTQyxHQUFHLEVBQUVDLFVBQVUsUUFBUSxvQkFBb0I7QUFFcEQsZUFBZSxVQUFVQyxjQUFjQSxDQUFBLEVBQUc7RUFBQWhCLGNBQUEsR0FBQWlCLENBQUE7RUFBQWpCLGNBQUEsR0FBQWtCLENBQUE7RUFDeEMsTUFBTUosR0FBRyxDQUFDLENBQ1JDLFVBQVUsQ0FBQ0YsZ0JBQWdCLENBQUNNLDBCQUEwQixFQUFFakIsY0FBYyxDQUFDLEVBQ3ZFYSxVQUFVLENBQUNGLGdCQUFnQixDQUFDTyx1QkFBdUIsRUFBRWpCLGtCQUFrQixDQUFDLEVBQ3hFWSxVQUFVLENBQUNGLGdCQUFnQixDQUFDUSxtQkFBbUIsRUFBRWpCLGlCQUFpQixDQUFDLEVBQ25FVyxVQUFVLENBQUNGLGdCQUFnQixDQUFDUyxxQkFBcUIsRUFBRWpCLG1CQUFtQixDQUFDLEVBQ3ZFVSxVQUFVLENBQUNGLGdCQUFnQixDQUFDVSxvQkFBb0IsRUFBRWpCLGlCQUFpQixDQUFDLEVBQ3BFUyxVQUFVLENBQUNGLGdCQUFnQixDQUFDVyxvQkFBb0IsRUFBRWpCLGlCQUFpQixDQUFDLEVBQ3BFUSxVQUFVLENBQ1JGLGdCQUFnQixDQUFDWSwwQkFBMEIsRUFDM0NqQix1QkFDRixDQUFDLEVBQ0RPLFVBQVUsQ0FDUkYsZ0JBQWdCLENBQUNhLCtCQUErQixFQUNoRGpCLDJCQUNGLENBQUMsRUFDRE0sVUFBVSxDQUFDRixnQkFBZ0IsQ0FBQ2MscUJBQXFCLEVBQUVqQixtQkFBbUIsQ0FBQyxFQUN2RUssVUFBVSxDQUFDRixnQkFBZ0IsQ0FBQ2UscUJBQXFCLEVBQUVqQix1QkFBdUIsQ0FBQyxFQUMzRUksVUFBVSxDQUFDRixnQkFBZ0IsQ0FBQ2dCLHFCQUFxQixFQUFFakIsdUJBQXVCLENBQUMsQ0FDNUUsQ0FBQztBQUNKIn0=