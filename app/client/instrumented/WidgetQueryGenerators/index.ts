function cov_1uqpkhqqrj() {
  var path = "/Users/apple/github/appsmith/app/client/src/WidgetQueryGenerators/index.ts";
  var hash = "cd16f184153409f3b4a6595f54b32df890761ab2";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/WidgetQueryGenerators/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 6,
          column: 0
        },
        end: {
          line: 6,
          column: 72
        }
      },
      "1": {
        start: {
          line: 7,
          column: 0
        },
        end: {
          line: 7,
          column: 78
        }
      }
    },
    fnMap: {},
    branchMap: {},
    s: {
      "0": 0,
      "1": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "cd16f184153409f3b4a6595f54b32df890761ab2"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1uqpkhqqrj = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1uqpkhqqrj();
import { PluginPackageName } from "entities/Action";
import WidgetQueryGeneratorRegistry from "utils/WidgetQueryGeneratorRegistry";
import MongoDB from "./MongoDB";
import PostgreSQL from "./PostgreSQL";
cov_1uqpkhqqrj().s[0]++;
WidgetQueryGeneratorRegistry.register(PluginPackageName.MONGO, MongoDB);
cov_1uqpkhqqrj().s[1]++;
WidgetQueryGeneratorRegistry.register(PluginPackageName.POSTGRES, PostgreSQL);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXVxcGtocXFyaiIsImFjdHVhbENvdmVyYWdlIiwiUGx1Z2luUGFja2FnZU5hbWUiLCJXaWRnZXRRdWVyeUdlbmVyYXRvclJlZ2lzdHJ5IiwiTW9uZ29EQiIsIlBvc3RncmVTUUwiLCJzIiwicmVnaXN0ZXIiLCJNT05HTyIsIlBPU1RHUkVTIl0sInNvdXJjZXMiOlsiaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGx1Z2luUGFja2FnZU5hbWUgfSBmcm9tIFwiZW50aXRpZXMvQWN0aW9uXCI7XG5pbXBvcnQgV2lkZ2V0UXVlcnlHZW5lcmF0b3JSZWdpc3RyeSBmcm9tIFwidXRpbHMvV2lkZ2V0UXVlcnlHZW5lcmF0b3JSZWdpc3RyeVwiO1xuaW1wb3J0IE1vbmdvREIgZnJvbSBcIi4vTW9uZ29EQlwiO1xuaW1wb3J0IFBvc3RncmVTUUwgZnJvbSBcIi4vUG9zdGdyZVNRTFwiO1xuXG5XaWRnZXRRdWVyeUdlbmVyYXRvclJlZ2lzdHJ5LnJlZ2lzdGVyKFBsdWdpblBhY2thZ2VOYW1lLk1PTkdPLCBNb25nb0RCKTtcbldpZGdldFF1ZXJ5R2VuZXJhdG9yUmVnaXN0cnkucmVnaXN0ZXIoUGx1Z2luUGFja2FnZU5hbWUuUE9TVEdSRVMsIFBvc3RncmVTUUwpO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLFNBQVNFLGlCQUFpQixRQUFRLGlCQUFpQjtBQUNuRCxPQUFPQyw0QkFBNEIsTUFBTSxvQ0FBb0M7QUFDN0UsT0FBT0MsT0FBTyxNQUFNLFdBQVc7QUFDL0IsT0FBT0MsVUFBVSxNQUFNLGNBQWM7QUFBQ0wsY0FBQSxHQUFBTSxDQUFBO0FBRXRDSCw0QkFBNEIsQ0FBQ0ksUUFBUSxDQUFDTCxpQkFBaUIsQ0FBQ00sS0FBSyxFQUFFSixPQUFPLENBQUM7QUFBQ0osY0FBQSxHQUFBTSxDQUFBO0FBQ3hFSCw0QkFBNEIsQ0FBQ0ksUUFBUSxDQUFDTCxpQkFBaUIsQ0FBQ08sUUFBUSxFQUFFSixVQUFVLENBQUMifQ==