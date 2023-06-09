function cov_18s3squdrs() {
  var path = "/Users/apple/github/appsmith/app/client/src/components/editorComponents/PaneWrapper.tsx";
  var hash = "45ab38dcf49c2c60481e1e4f4d82b47959f9ad8c";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/components/editorComponents/PaneWrapper.tsx",
    statementMap: {
      "0": {
        start: {
          line: 6,
          column: 30
        },
        end: {
          line: 6,
          column: 50
        }
      },
      "1": {
        start: {
          line: 8,
          column: 22
        },
        end: {
          line: 8,
          column: 53
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 6,
            column: 19
          },
          end: {
            line: 6,
            column: 20
          }
        },
        loc: {
          start: {
            line: 6,
            column: 30
          },
          end: {
            line: 6,
            column: 50
          }
        },
        line: 6
      },
      "1": {
        name: "(anonymous_1)",
        decl: {
          start: {
            line: 8,
            column: 11
          },
          end: {
            line: 8,
            column: 12
          }
        },
        loc: {
          start: {
            line: 8,
            column: 22
          },
          end: {
            line: 8,
            column: 53
          }
        },
        line: 8
      }
    },
    branchMap: {},
    s: {
      "0": 0,
      "1": 0
    },
    f: {
      "0": 0,
      "1": 0
    },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "45ab38dcf49c2c60481e1e4f4d82b47959f9ad8c"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_18s3squdrs = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_18s3squdrs();
import styled from "styled-components";
import { Colors } from "constants/Colors";
export default styled.div`
  background-color: ${Colors.GREY_1};
  border-radius: ${props => {
  cov_18s3squdrs().f[0]++;
  cov_18s3squdrs().s[0]++;
  return props.theme.radii[0];
}}px;
  box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.2), 0px 2px 10px rgba(0, 0, 0, 0.1);
  color: ${props => {
  cov_18s3squdrs().f[1]++;
  cov_18s3squdrs().s[1]++;
  return props.theme.colors.textOnDarkBG;
}};
  text-transform: capitalize;
`;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMThzM3NxdWRycyIsImFjdHVhbENvdmVyYWdlIiwic3R5bGVkIiwiQ29sb3JzIiwiZGl2IiwiR1JFWV8xIiwicHJvcHMiLCJmIiwicyIsInRoZW1lIiwicmFkaWkiLCJjb2xvcnMiLCJ0ZXh0T25EYXJrQkciXSwic291cmNlcyI6WyJQYW5lV3JhcHBlci50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHN0eWxlZCBmcm9tIFwic3R5bGVkLWNvbXBvbmVudHNcIjtcbmltcG9ydCB7IENvbG9ycyB9IGZyb20gXCJjb25zdGFudHMvQ29sb3JzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IHN0eWxlZC5kaXZgXG4gIGJhY2tncm91bmQtY29sb3I6ICR7Q29sb3JzLkdSRVlfMX07XG4gIGJvcmRlci1yYWRpdXM6ICR7KHByb3BzKSA9PiBwcm9wcy50aGVtZS5yYWRpaVswXX1weDtcbiAgYm94LXNoYWRvdzogMHB4IDBweCAycHggcmdiYSgwLCAwLCAwLCAwLjIpLCAwcHggMnB4IDEwcHggcmdiYSgwLCAwLCAwLCAwLjEpO1xuICBjb2xvcjogJHsocHJvcHMpID0+IHByb3BzLnRoZW1lLmNvbG9ycy50ZXh0T25EYXJrQkd9O1xuICB0ZXh0LXRyYW5zZm9ybTogY2FwaXRhbGl6ZTtcbmA7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLE9BQU9FLE1BQU0sTUFBTSxtQkFBbUI7QUFDdEMsU0FBU0MsTUFBTSxRQUFRLGtCQUFrQjtBQUV6QyxlQUFlRCxNQUFNLENBQUNFLEdBQUk7QUFDMUIsc0JBQXNCRCxNQUFNLENBQUNFLE1BQU87QUFDcEMsbUJBQW9CQyxLQUFLLElBQUs7RUFBQU4sY0FBQSxHQUFBTyxDQUFBO0VBQUFQLGNBQUEsR0FBQVEsQ0FBQTtFQUFBLE9BQUFGLEtBQUssQ0FBQ0csS0FBSyxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQUQsQ0FBRTtBQUNuRDtBQUNBLFdBQVlKLEtBQUssSUFBSztFQUFBTixjQUFBLEdBQUFPLENBQUE7RUFBQVAsY0FBQSxHQUFBUSxDQUFBO0VBQUEsT0FBQUYsS0FBSyxDQUFDRyxLQUFLLENBQUNFLE1BQU0sQ0FBQ0MsWUFBWTtBQUFELENBQUU7QUFDdEQ7QUFDQSxDQUFDIn0=