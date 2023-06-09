function cov_1r1bp1zyxm() {
  var path = "/Users/apple/github/appsmith/app/client/src/pages/Editor/gitSync/components/DangerMenuItem.tsx";
  var hash = "e3ab54108d140808773b57ae6df49fe6c18613d4";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/pages/Editor/gitSync/components/DangerMenuItem.tsx",
    statementMap: {
      "0": {
        start: {
          line: 5,
          column: 23
        },
        end: {
          line: 18,
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
    hash: "e3ab54108d140808773b57ae6df49fe6c18613d4"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1r1bp1zyxm = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1r1bp1zyxm();
import styled from "styled-components";
import { MenuItem } from "design-system-old";
import { Colors } from "constants/Colors";
const DangerMenuItem = (cov_1r1bp1zyxm().s[0]++, styled(MenuItem)`
  &&,
  && .cs-text {
    color: ${Colors.DANGER_SOLID};
  }

  &&,
  &&:hover {
    svg,
    svg path {
      fill: ${Colors.DANGER_SOLID};
    }
  }
`);
export default DangerMenuItem;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXIxYnAxenl4bSIsImFjdHVhbENvdmVyYWdlIiwic3R5bGVkIiwiTWVudUl0ZW0iLCJDb2xvcnMiLCJEYW5nZXJNZW51SXRlbSIsInMiLCJEQU5HRVJfU09MSUQiXSwic291cmNlcyI6WyJEYW5nZXJNZW51SXRlbS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHN0eWxlZCBmcm9tIFwic3R5bGVkLWNvbXBvbmVudHNcIjtcbmltcG9ydCB7IE1lbnVJdGVtIH0gZnJvbSBcImRlc2lnbi1zeXN0ZW0tb2xkXCI7XG5pbXBvcnQgeyBDb2xvcnMgfSBmcm9tIFwiY29uc3RhbnRzL0NvbG9yc1wiO1xuXG5jb25zdCBEYW5nZXJNZW51SXRlbSA9IHN0eWxlZChNZW51SXRlbSlgXG4gICYmLFxuICAmJiAuY3MtdGV4dCB7XG4gICAgY29sb3I6ICR7Q29sb3JzLkRBTkdFUl9TT0xJRH07XG4gIH1cblxuICAmJixcbiAgJiY6aG92ZXIge1xuICAgIHN2ZyxcbiAgICBzdmcgcGF0aCB7XG4gICAgICBmaWxsOiAke0NvbG9ycy5EQU5HRVJfU09MSUR9O1xuICAgIH1cbiAgfVxuYDtcblxuZXhwb3J0IGRlZmF1bHQgRGFuZ2VyTWVudUl0ZW07XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLE9BQU9FLE1BQU0sTUFBTSxtQkFBbUI7QUFDdEMsU0FBU0MsUUFBUSxRQUFRLG1CQUFtQjtBQUM1QyxTQUFTQyxNQUFNLFFBQVEsa0JBQWtCO0FBRXpDLE1BQU1DLGNBQWMsSUFBQUwsY0FBQSxHQUFBTSxDQUFBLE9BQUdKLE1BQU0sQ0FBQ0MsUUFBUSxDQUFFO0FBQ3hDO0FBQ0E7QUFDQSxhQUFhQyxNQUFNLENBQUNHLFlBQWE7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBY0gsTUFBTSxDQUFDRyxZQUFhO0FBQ2xDO0FBQ0E7QUFDQSxDQUFDO0FBRUQsZUFBZUYsY0FBYyJ9