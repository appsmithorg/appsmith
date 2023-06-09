function cov_1y1qs12b98() {
  var path = "/Users/apple/github/appsmith/app/client/src/pages/Templates/Template/LargeTemplate.tsx";
  var hash = "42918832619358f809807adb8541bd0efe0684ae";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/pages/Templates/Template/LargeTemplate.tsx",
    statementMap: {
      "0": {
        start: {
          line: 5,
          column: 22
        },
        end: {
          line: 34,
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
    hash: "42918832619358f809807adb8541bd0efe0684ae"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1y1qs12b98 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1y1qs12b98();
import { getTypographyByKey } from "design-system-old";
import styled from "styled-components";
import { TemplateLayout } from "./index";
const LargeTemplate = (cov_1y1qs12b98().s[0]++, styled(TemplateLayout)`
  border: 1px solid var(--ads-v2-color-border);
  display: flex;
  flex: 1;
  flex-direction: column;
  cursor: pointer;
  &:hover {
    border-color: var(--ads-v2-color-border-emphasis);
  }

  && {
    .title {
      ${getTypographyByKey("h1")}
    }
    .categories {
      ${getTypographyByKey("h4")}
      font-weight: normal;
    }
    .description {
      ${getTypographyByKey("p1")}
      flex: 1;
    }
  }

  .image-wrapper {
    transition: all 1s ease-out;
    width: 100%;
    height: 270px;
  }
`);
export default LargeTemplate;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXkxcXMxMmI5OCIsImFjdHVhbENvdmVyYWdlIiwiZ2V0VHlwb2dyYXBoeUJ5S2V5Iiwic3R5bGVkIiwiVGVtcGxhdGVMYXlvdXQiLCJMYXJnZVRlbXBsYXRlIiwicyJdLCJzb3VyY2VzIjpbIkxhcmdlVGVtcGxhdGUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdldFR5cG9ncmFwaHlCeUtleSB9IGZyb20gXCJkZXNpZ24tc3lzdGVtLW9sZFwiO1xuaW1wb3J0IHN0eWxlZCBmcm9tIFwic3R5bGVkLWNvbXBvbmVudHNcIjtcbmltcG9ydCB7IFRlbXBsYXRlTGF5b3V0IH0gZnJvbSBcIi4vaW5kZXhcIjtcblxuY29uc3QgTGFyZ2VUZW1wbGF0ZSA9IHN0eWxlZChUZW1wbGF0ZUxheW91dClgXG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWFkcy12Mi1jb2xvci1ib3JkZXIpO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4OiAxO1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gICY6aG92ZXIge1xuICAgIGJvcmRlci1jb2xvcjogdmFyKC0tYWRzLXYyLWNvbG9yLWJvcmRlci1lbXBoYXNpcyk7XG4gIH1cblxuICAmJiB7XG4gICAgLnRpdGxlIHtcbiAgICAgICR7Z2V0VHlwb2dyYXBoeUJ5S2V5KFwiaDFcIil9XG4gICAgfVxuICAgIC5jYXRlZ29yaWVzIHtcbiAgICAgICR7Z2V0VHlwb2dyYXBoeUJ5S2V5KFwiaDRcIil9XG4gICAgICBmb250LXdlaWdodDogbm9ybWFsO1xuICAgIH1cbiAgICAuZGVzY3JpcHRpb24ge1xuICAgICAgJHtnZXRUeXBvZ3JhcGh5QnlLZXkoXCJwMVwiKX1cbiAgICAgIGZsZXg6IDE7XG4gICAgfVxuICB9XG5cbiAgLmltYWdlLXdyYXBwZXIge1xuICAgIHRyYW5zaXRpb246IGFsbCAxcyBlYXNlLW91dDtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBoZWlnaHQ6IDI3MHB4O1xuICB9XG5gO1xuXG5leHBvcnQgZGVmYXVsdCBMYXJnZVRlbXBsYXRlO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixTQUFTRSxrQkFBa0IsUUFBUSxtQkFBbUI7QUFDdEQsT0FBT0MsTUFBTSxNQUFNLG1CQUFtQjtBQUN0QyxTQUFTQyxjQUFjLFFBQVEsU0FBUztBQUV4QyxNQUFNQyxhQUFhLElBQUFMLGNBQUEsR0FBQU0sQ0FBQSxPQUFHSCxNQUFNLENBQUNDLGNBQWMsQ0FBRTtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUUYsa0JBQWtCLENBQUMsSUFBSSxDQUFFO0FBQ2pDO0FBQ0E7QUFDQSxRQUFRQSxrQkFBa0IsQ0FBQyxJQUFJLENBQUU7QUFDakM7QUFDQTtBQUNBO0FBQ0EsUUFBUUEsa0JBQWtCLENBQUMsSUFBSSxDQUFFO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFFRCxlQUFlRyxhQUFhIn0=