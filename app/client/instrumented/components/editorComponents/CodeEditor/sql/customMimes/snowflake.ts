function cov_1aapwj0btt() {
  var path = "/Users/apple/github/appsmith/app/client/src/components/editorComponents/CodeEditor/sql/customMimes/snowflake.ts";
  var hash = "444af7458bb78af5beb51d4a38aefe103d0e42c9";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/components/editorComponents/CodeEditor/sql/customMimes/snowflake.ts",
    statementMap: {
      "0": {
        start: {
          line: 8,
          column: 25
        },
        end: {
          line: 8,
          column: 61
        }
      },
      "1": {
        start: {
          line: 10,
          column: 36
        },
        end: {
          line: 15,
          column: 1
        }
      },
      "2": {
        start: {
          line: 16,
          column: 24
        },
        end: {
          line: 16,
          column: 69
        }
      },
      "3": {
        start: {
          line: 19,
          column: 0
        },
        end: {
          line: 22,
          column: 2
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
    hash: "444af7458bb78af5beb51d4a38aefe103d0e42c9"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1aapwj0btt = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1aapwj0btt();
import CodeMirror from "codemirror";
import { merge } from "lodash";
import { EditorModes } from "../../EditorConfig";
import { getSqlMimeFromMode } from "../config";
import { spaceSeparatedStringToObject } from "./utils";

// @ts-expect-error: No type available
const defaultSQLConfig = (cov_1aapwj0btt().s[0]++, CodeMirror.resolveMode("text/x-sql"));
export const snowflakeKeywordsMap = (cov_1aapwj0btt().s[1]++, {
  // Ref:  https://docs.snowflake.com/en/sql-reference/reserved-keywords
  keywords: spaceSeparatedStringToObject("account all alter and any as between by case cast check column connect connection constraint create cross current current_date current_time current_timestamp current_user database delete distinct drop else exists false following for from full grant group gscluster having ilike in increment inner insert intersect into is issue join lateral left like localtime localtimestamp minus natural not null of on or order organization qualify regexp revoke right rlike row rows sample schema select set some start table tablesample then to trigger true try_cast union unique update using values  view when whenever where with")
});
const snowflakeConfig = (cov_1aapwj0btt().s[2]++, merge(defaultSQLConfig, snowflakeKeywordsMap));

// Inspired by https://github.com/codemirror/codemirror5/blob/9974ded36bf01746eb2a00926916fef834d3d0d0/mode/sql/sql.js#L290
cov_1aapwj0btt().s[3]++;
CodeMirror.defineMIME(getSqlMimeFromMode(EditorModes.SNOWFLAKE_WITH_BINDING), snowflakeConfig);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMWFhcHdqMGJ0dCIsImFjdHVhbENvdmVyYWdlIiwiQ29kZU1pcnJvciIsIm1lcmdlIiwiRWRpdG9yTW9kZXMiLCJnZXRTcWxNaW1lRnJvbU1vZGUiLCJzcGFjZVNlcGFyYXRlZFN0cmluZ1RvT2JqZWN0IiwiZGVmYXVsdFNRTENvbmZpZyIsInMiLCJyZXNvbHZlTW9kZSIsInNub3dmbGFrZUtleXdvcmRzTWFwIiwia2V5d29yZHMiLCJzbm93Zmxha2VDb25maWciLCJkZWZpbmVNSU1FIiwiU05PV0ZMQUtFX1dJVEhfQklORElORyJdLCJzb3VyY2VzIjpbInNub3dmbGFrZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQ29kZU1pcnJvciBmcm9tIFwiY29kZW1pcnJvclwiO1xuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBFZGl0b3JNb2RlcyB9IGZyb20gXCIuLi8uLi9FZGl0b3JDb25maWdcIjtcbmltcG9ydCB7IGdldFNxbE1pbWVGcm9tTW9kZSB9IGZyb20gXCIuLi9jb25maWdcIjtcbmltcG9ydCB7IHNwYWNlU2VwYXJhdGVkU3RyaW5nVG9PYmplY3QgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG4vLyBAdHMtZXhwZWN0LWVycm9yOiBObyB0eXBlIGF2YWlsYWJsZVxuY29uc3QgZGVmYXVsdFNRTENvbmZpZyA9IENvZGVNaXJyb3IucmVzb2x2ZU1vZGUoXCJ0ZXh0L3gtc3FsXCIpO1xuXG5leHBvcnQgY29uc3Qgc25vd2ZsYWtlS2V5d29yZHNNYXAgPSB7XG4gIC8vIFJlZjogIGh0dHBzOi8vZG9jcy5zbm93Zmxha2UuY29tL2VuL3NxbC1yZWZlcmVuY2UvcmVzZXJ2ZWQta2V5d29yZHNcbiAga2V5d29yZHM6IHNwYWNlU2VwYXJhdGVkU3RyaW5nVG9PYmplY3QoXG4gICAgXCJhY2NvdW50IGFsbCBhbHRlciBhbmQgYW55IGFzIGJldHdlZW4gYnkgY2FzZSBjYXN0IGNoZWNrIGNvbHVtbiBjb25uZWN0IGNvbm5lY3Rpb24gY29uc3RyYWludCBjcmVhdGUgY3Jvc3MgY3VycmVudCBjdXJyZW50X2RhdGUgY3VycmVudF90aW1lIGN1cnJlbnRfdGltZXN0YW1wIGN1cnJlbnRfdXNlciBkYXRhYmFzZSBkZWxldGUgZGlzdGluY3QgZHJvcCBlbHNlIGV4aXN0cyBmYWxzZSBmb2xsb3dpbmcgZm9yIGZyb20gZnVsbCBncmFudCBncm91cCBnc2NsdXN0ZXIgaGF2aW5nIGlsaWtlIGluIGluY3JlbWVudCBpbm5lciBpbnNlcnQgaW50ZXJzZWN0IGludG8gaXMgaXNzdWUgam9pbiBsYXRlcmFsIGxlZnQgbGlrZSBsb2NhbHRpbWUgbG9jYWx0aW1lc3RhbXAgbWludXMgbmF0dXJhbCBub3QgbnVsbCBvZiBvbiBvciBvcmRlciBvcmdhbml6YXRpb24gcXVhbGlmeSByZWdleHAgcmV2b2tlIHJpZ2h0IHJsaWtlIHJvdyByb3dzIHNhbXBsZSBzY2hlbWEgc2VsZWN0IHNldCBzb21lIHN0YXJ0IHRhYmxlIHRhYmxlc2FtcGxlIHRoZW4gdG8gdHJpZ2dlciB0cnVlIHRyeV9jYXN0IHVuaW9uIHVuaXF1ZSB1cGRhdGUgdXNpbmcgdmFsdWVzICB2aWV3IHdoZW4gd2hlbmV2ZXIgd2hlcmUgd2l0aFwiLFxuICApLFxufTtcbmNvbnN0IHNub3dmbGFrZUNvbmZpZyA9IG1lcmdlKGRlZmF1bHRTUUxDb25maWcsIHNub3dmbGFrZUtleXdvcmRzTWFwKTtcblxuLy8gSW5zcGlyZWQgYnkgaHR0cHM6Ly9naXRodWIuY29tL2NvZGVtaXJyb3IvY29kZW1pcnJvcjUvYmxvYi85OTc0ZGVkMzZiZjAxNzQ2ZWIyYTAwOTI2OTE2ZmVmODM0ZDNkMGQwL21vZGUvc3FsL3NxbC5qcyNMMjkwXG5Db2RlTWlycm9yLmRlZmluZU1JTUUoXG4gIGdldFNxbE1pbWVGcm9tTW9kZShFZGl0b3JNb2Rlcy5TTk9XRkxBS0VfV0lUSF9CSU5ESU5HKSxcbiAgc25vd2ZsYWtlQ29uZmlnLFxuKTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosT0FBT0UsVUFBVSxNQUFNLFlBQVk7QUFDbkMsU0FBU0MsS0FBSyxRQUFRLFFBQVE7QUFDOUIsU0FBU0MsV0FBVyxRQUFRLG9CQUFvQjtBQUNoRCxTQUFTQyxrQkFBa0IsUUFBUSxXQUFXO0FBQzlDLFNBQVNDLDRCQUE0QixRQUFRLFNBQVM7O0FBRXREO0FBQ0EsTUFBTUMsZ0JBQWdCLElBQUFQLGNBQUEsR0FBQVEsQ0FBQSxPQUFHTixVQUFVLENBQUNPLFdBQVcsQ0FBQyxZQUFZLENBQUM7QUFFN0QsT0FBTyxNQUFNQyxvQkFBb0IsSUFBQVYsY0FBQSxHQUFBUSxDQUFBLE9BQUc7RUFDbEM7RUFDQUcsUUFBUSxFQUFFTCw0QkFBNEIsQ0FDcEMsMm1CQUNGO0FBQ0YsQ0FBQztBQUNELE1BQU1NLGVBQWUsSUFBQVosY0FBQSxHQUFBUSxDQUFBLE9BQUdMLEtBQUssQ0FBQ0ksZ0JBQWdCLEVBQUVHLG9CQUFvQixDQUFDOztBQUVyRTtBQUFBVixjQUFBLEdBQUFRLENBQUE7QUFDQU4sVUFBVSxDQUFDVyxVQUFVLENBQ25CUixrQkFBa0IsQ0FBQ0QsV0FBVyxDQUFDVSxzQkFBc0IsQ0FBQyxFQUN0REYsZUFDRixDQUFDIn0=