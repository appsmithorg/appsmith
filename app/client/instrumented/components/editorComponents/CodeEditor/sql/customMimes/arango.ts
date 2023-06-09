function cov_1xmfv2cueo() {
  var path = "/Users/apple/github/appsmith/app/client/src/components/editorComponents/CodeEditor/sql/customMimes/arango.ts";
  var hash = "fd6172d8cb5c1f3c2e56f6efd5ea0afbf6be7929";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/components/editorComponents/CodeEditor/sql/customMimes/arango.ts",
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
          column: 33
        },
        end: {
          line: 15,
          column: 1
        }
      },
      "2": {
        start: {
          line: 16,
          column: 21
        },
        end: {
          line: 16,
          column: 63
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
    hash: "fd6172d8cb5c1f3c2e56f6efd5ea0afbf6be7929"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1xmfv2cueo = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1xmfv2cueo();
import CodeMirror from "codemirror";
import { merge } from "lodash";
import { EditorModes } from "../../EditorConfig";
import { getSqlMimeFromMode } from "../config";
import { spaceSeparatedStringToObject } from "./utils";

// @ts-expect-error: No type available
const defaultSQLConfig = (cov_1xmfv2cueo().s[0]++, CodeMirror.resolveMode("text/x-sql"));
export const arangoKeywordsMap = (cov_1xmfv2cueo().s[1]++, {
  // https://www.arangodb.com/docs/stable/aql/fundamentals-syntax.html
  keywords: spaceSeparatedStringToObject("for return filter search sort limit let collect window insert update replace remove upsert with aggregate all all_shortest_paths and any asc collect desc distinct false filter for graph in inbound insert into k_paths k_shortest_paths let like limit none not null or outbound remove replace return shortest_path sort true update upsert window with keep count options prune search to current new")
});
const arangoConfig = (cov_1xmfv2cueo().s[2]++, merge(defaultSQLConfig, arangoKeywordsMap));

// Inspired by https://github.com/codemirror/codemirror5/blob/9974ded36bf01746eb2a00926916fef834d3d0d0/mode/sql/sql.js#L290
cov_1xmfv2cueo().s[3]++;
CodeMirror.defineMIME(getSqlMimeFromMode(EditorModes.ARANGO_WITH_BINDING), arangoConfig);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXhtZnYyY3VlbyIsImFjdHVhbENvdmVyYWdlIiwiQ29kZU1pcnJvciIsIm1lcmdlIiwiRWRpdG9yTW9kZXMiLCJnZXRTcWxNaW1lRnJvbU1vZGUiLCJzcGFjZVNlcGFyYXRlZFN0cmluZ1RvT2JqZWN0IiwiZGVmYXVsdFNRTENvbmZpZyIsInMiLCJyZXNvbHZlTW9kZSIsImFyYW5nb0tleXdvcmRzTWFwIiwia2V5d29yZHMiLCJhcmFuZ29Db25maWciLCJkZWZpbmVNSU1FIiwiQVJBTkdPX1dJVEhfQklORElORyJdLCJzb3VyY2VzIjpbImFyYW5nby50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQ29kZU1pcnJvciBmcm9tIFwiY29kZW1pcnJvclwiO1xuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBFZGl0b3JNb2RlcyB9IGZyb20gXCIuLi8uLi9FZGl0b3JDb25maWdcIjtcbmltcG9ydCB7IGdldFNxbE1pbWVGcm9tTW9kZSB9IGZyb20gXCIuLi9jb25maWdcIjtcbmltcG9ydCB7IHNwYWNlU2VwYXJhdGVkU3RyaW5nVG9PYmplY3QgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG4vLyBAdHMtZXhwZWN0LWVycm9yOiBObyB0eXBlIGF2YWlsYWJsZVxuY29uc3QgZGVmYXVsdFNRTENvbmZpZyA9IENvZGVNaXJyb3IucmVzb2x2ZU1vZGUoXCJ0ZXh0L3gtc3FsXCIpO1xuXG5leHBvcnQgY29uc3QgYXJhbmdvS2V5d29yZHNNYXAgPSB7XG4gIC8vIGh0dHBzOi8vd3d3LmFyYW5nb2RiLmNvbS9kb2NzL3N0YWJsZS9hcWwvZnVuZGFtZW50YWxzLXN5bnRheC5odG1sXG4gIGtleXdvcmRzOiBzcGFjZVNlcGFyYXRlZFN0cmluZ1RvT2JqZWN0KFxuICAgIFwiZm9yIHJldHVybiBmaWx0ZXIgc2VhcmNoIHNvcnQgbGltaXQgbGV0IGNvbGxlY3Qgd2luZG93IGluc2VydCB1cGRhdGUgcmVwbGFjZSByZW1vdmUgdXBzZXJ0IHdpdGggYWdncmVnYXRlIGFsbCBhbGxfc2hvcnRlc3RfcGF0aHMgYW5kIGFueSBhc2MgY29sbGVjdCBkZXNjIGRpc3RpbmN0IGZhbHNlIGZpbHRlciBmb3IgZ3JhcGggaW4gaW5ib3VuZCBpbnNlcnQgaW50byBrX3BhdGhzIGtfc2hvcnRlc3RfcGF0aHMgbGV0IGxpa2UgbGltaXQgbm9uZSBub3QgbnVsbCBvciBvdXRib3VuZCByZW1vdmUgcmVwbGFjZSByZXR1cm4gc2hvcnRlc3RfcGF0aCBzb3J0IHRydWUgdXBkYXRlIHVwc2VydCB3aW5kb3cgd2l0aCBrZWVwIGNvdW50IG9wdGlvbnMgcHJ1bmUgc2VhcmNoIHRvIGN1cnJlbnQgbmV3XCIsXG4gICksXG59O1xuY29uc3QgYXJhbmdvQ29uZmlnID0gbWVyZ2UoZGVmYXVsdFNRTENvbmZpZywgYXJhbmdvS2V5d29yZHNNYXApO1xuXG4vLyBJbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vY29kZW1pcnJvci9jb2RlbWlycm9yNS9ibG9iLzk5NzRkZWQzNmJmMDE3NDZlYjJhMDA5MjY5MTZmZWY4MzRkM2QwZDAvbW9kZS9zcWwvc3FsLmpzI0wyOTBcbkNvZGVNaXJyb3IuZGVmaW5lTUlNRShcbiAgZ2V0U3FsTWltZUZyb21Nb2RlKEVkaXRvck1vZGVzLkFSQU5HT19XSVRIX0JJTkRJTkcpLFxuICBhcmFuZ29Db25maWcsXG4pO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixPQUFPRSxVQUFVLE1BQU0sWUFBWTtBQUNuQyxTQUFTQyxLQUFLLFFBQVEsUUFBUTtBQUM5QixTQUFTQyxXQUFXLFFBQVEsb0JBQW9CO0FBQ2hELFNBQVNDLGtCQUFrQixRQUFRLFdBQVc7QUFDOUMsU0FBU0MsNEJBQTRCLFFBQVEsU0FBUzs7QUFFdEQ7QUFDQSxNQUFNQyxnQkFBZ0IsSUFBQVAsY0FBQSxHQUFBUSxDQUFBLE9BQUdOLFVBQVUsQ0FBQ08sV0FBVyxDQUFDLFlBQVksQ0FBQztBQUU3RCxPQUFPLE1BQU1DLGlCQUFpQixJQUFBVixjQUFBLEdBQUFRLENBQUEsT0FBRztFQUMvQjtFQUNBRyxRQUFRLEVBQUVMLDRCQUE0QixDQUNwQywyWUFDRjtBQUNGLENBQUM7QUFDRCxNQUFNTSxZQUFZLElBQUFaLGNBQUEsR0FBQVEsQ0FBQSxPQUFHTCxLQUFLLENBQUNJLGdCQUFnQixFQUFFRyxpQkFBaUIsQ0FBQzs7QUFFL0Q7QUFBQVYsY0FBQSxHQUFBUSxDQUFBO0FBQ0FOLFVBQVUsQ0FBQ1csVUFBVSxDQUNuQlIsa0JBQWtCLENBQUNELFdBQVcsQ0FBQ1UsbUJBQW1CLENBQUMsRUFDbkRGLFlBQ0YsQ0FBQyJ9