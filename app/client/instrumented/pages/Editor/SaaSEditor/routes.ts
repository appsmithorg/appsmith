function cov_y6sznuxow() {
  var path = "/Users/apple/github/appsmith/app/client/src/pages/Editor/SaaSEditor/routes.ts";
  var hash = "43b7fbd9e6ac64741eccf05dc37454f99bfaf3f8";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/pages/Editor/SaaSEditor/routes.ts",
    statementMap: {
      "0": {
        start: {
          line: 10,
          column: 32
        },
        end: {
          line: 23,
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
    hash: "43b7fbd9e6ac64741eccf05dc37454f99bfaf3f8"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_y6sznuxow = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_y6sznuxow();
import { SAAS_EDITOR_PATH, SAAS_EDITOR_DATASOURCE_ID_PATH, SAAS_EDITOR_API_ID_PATH } from "pages/Editor/SaaSEditor/constants";
import ListView from "pages/Editor/SaaSEditor/ListView";
import DatasourceForm from "pages/Editor/SaaSEditor/DatasourceForm";
import QueryEditor from "../QueryEditor";
export const SaaSEditorRoutes = (cov_y6sznuxow().s[0]++, [{
  path: SAAS_EDITOR_PATH,
  component: ListView
}, {
  path: SAAS_EDITOR_DATASOURCE_ID_PATH,
  component: DatasourceForm
}, {
  path: SAAS_EDITOR_API_ID_PATH,
  component: QueryEditor
}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfeTZzem51eG93IiwiYWN0dWFsQ292ZXJhZ2UiLCJTQUFTX0VESVRPUl9QQVRIIiwiU0FBU19FRElUT1JfREFUQVNPVVJDRV9JRF9QQVRIIiwiU0FBU19FRElUT1JfQVBJX0lEX1BBVEgiLCJMaXN0VmlldyIsIkRhdGFzb3VyY2VGb3JtIiwiUXVlcnlFZGl0b3IiLCJTYWFTRWRpdG9yUm91dGVzIiwicyIsInBhdGgiLCJjb21wb25lbnQiXSwic291cmNlcyI6WyJyb3V0ZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgU0FBU19FRElUT1JfUEFUSCxcbiAgU0FBU19FRElUT1JfREFUQVNPVVJDRV9JRF9QQVRILFxuICBTQUFTX0VESVRPUl9BUElfSURfUEFUSCxcbn0gZnJvbSBcInBhZ2VzL0VkaXRvci9TYWFTRWRpdG9yL2NvbnN0YW50c1wiO1xuaW1wb3J0IExpc3RWaWV3IGZyb20gXCJwYWdlcy9FZGl0b3IvU2FhU0VkaXRvci9MaXN0Vmlld1wiO1xuaW1wb3J0IERhdGFzb3VyY2VGb3JtIGZyb20gXCJwYWdlcy9FZGl0b3IvU2FhU0VkaXRvci9EYXRhc291cmNlRm9ybVwiO1xuaW1wb3J0IFF1ZXJ5RWRpdG9yIGZyb20gXCIuLi9RdWVyeUVkaXRvclwiO1xuXG5leHBvcnQgY29uc3QgU2FhU0VkaXRvclJvdXRlcyA9IFtcbiAge1xuICAgIHBhdGg6IFNBQVNfRURJVE9SX1BBVEgsXG4gICAgY29tcG9uZW50OiBMaXN0VmlldyxcbiAgfSxcbiAge1xuICAgIHBhdGg6IFNBQVNfRURJVE9SX0RBVEFTT1VSQ0VfSURfUEFUSCxcbiAgICBjb21wb25lbnQ6IERhdGFzb3VyY2VGb3JtLFxuICB9LFxuICB7XG4gICAgcGF0aDogU0FBU19FRElUT1JfQVBJX0lEX1BBVEgsXG4gICAgY29tcG9uZW50OiBRdWVyeUVkaXRvcixcbiAgfSxcbl07XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsYUFBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsYUFBQTtBQWZaLFNBQ0VFLGdCQUFnQixFQUNoQkMsOEJBQThCLEVBQzlCQyx1QkFBdUIsUUFDbEIsbUNBQW1DO0FBQzFDLE9BQU9DLFFBQVEsTUFBTSxrQ0FBa0M7QUFDdkQsT0FBT0MsY0FBYyxNQUFNLHdDQUF3QztBQUNuRSxPQUFPQyxXQUFXLE1BQU0sZ0JBQWdCO0FBRXhDLE9BQU8sTUFBTUMsZ0JBQWdCLElBQUFSLGFBQUEsR0FBQVMsQ0FBQSxPQUFHLENBQzlCO0VBQ0VDLElBQUksRUFBRVIsZ0JBQWdCO0VBQ3RCUyxTQUFTLEVBQUVOO0FBQ2IsQ0FBQyxFQUNEO0VBQ0VLLElBQUksRUFBRVAsOEJBQThCO0VBQ3BDUSxTQUFTLEVBQUVMO0FBQ2IsQ0FBQyxFQUNEO0VBQ0VJLElBQUksRUFBRU4sdUJBQXVCO0VBQzdCTyxTQUFTLEVBQUVKO0FBQ2IsQ0FBQyxDQUNGIn0=