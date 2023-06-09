function cov_kbs297n9t() {
  var path = "/Users/apple/github/appsmith/app/client/src/components/designSystems/appsmith/StyledHeader.tsx";
  var hash = "490a677ae38e1f22918de09e1871d3fc5633c918";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/components/designSystems/appsmith/StyledHeader.tsx",
    statementMap: {
      "0": {
        start: {
          line: 8,
          column: 23
        },
        end: {
          line: 8,
          column: 47
        }
      },
      "1": {
        start: {
          line: 12,
          column: 26
        },
        end: {
          line: 12,
          column: 50
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 8,
            column: 12
          },
          end: {
            line: 8,
            column: 13
          }
        },
        loc: {
          start: {
            line: 8,
            column: 23
          },
          end: {
            line: 8,
            column: 47
          }
        },
        line: 8
      },
      "1": {
        name: "(anonymous_1)",
        decl: {
          start: {
            line: 12,
            column: 15
          },
          end: {
            line: 12,
            column: 16
          }
        },
        loc: {
          start: {
            line: 12,
            column: 26
          },
          end: {
            line: 12,
            column: 50
          }
        },
        line: 12
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
    hash: "490a677ae38e1f22918de09e1871d3fc5633c918"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_kbs297n9t = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_kbs297n9t();
import styled from "styled-components";
export default styled.header`
  display: flex;
  width: 100%;
  justify-content: space-around;
  align-items: center;
  height: ${props => {
  cov_kbs297n9t().f[0]++;
  cov_kbs297n9t().s[0]++;
  return props.theme.headerHeight;
}};
  padding: 0px 30px;
  padding-left: 24px;
  background: var(--ads-v2-color-bg);
  font-size: ${props => {
  cov_kbs297n9t().f[1]++;
  cov_kbs297n9t().s[1]++;
  return props.theme.fontSizes[1];
}}px;
`;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3Zfa2JzMjk3bjl0IiwiYWN0dWFsQ292ZXJhZ2UiLCJzdHlsZWQiLCJoZWFkZXIiLCJwcm9wcyIsImYiLCJzIiwidGhlbWUiLCJoZWFkZXJIZWlnaHQiLCJmb250U2l6ZXMiXSwic291cmNlcyI6WyJTdHlsZWRIZWFkZXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzdHlsZWQgZnJvbSBcInN0eWxlZC1jb21wb25lbnRzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IHN0eWxlZC5oZWFkZXJgXG4gIGRpc3BsYXk6IGZsZXg7XG4gIHdpZHRoOiAxMDAlO1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWFyb3VuZDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgaGVpZ2h0OiAkeyhwcm9wcykgPT4gcHJvcHMudGhlbWUuaGVhZGVySGVpZ2h0fTtcbiAgcGFkZGluZzogMHB4IDMwcHg7XG4gIHBhZGRpbmctbGVmdDogMjRweDtcbiAgYmFja2dyb3VuZDogdmFyKC0tYWRzLXYyLWNvbG9yLWJnKTtcbiAgZm9udC1zaXplOiAkeyhwcm9wcykgPT4gcHJvcHMudGhlbWUuZm9udFNpemVzWzFdfXB4O1xuYDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxhQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxhQUFBO0FBZlosT0FBT0UsTUFBTSxNQUFNLG1CQUFtQjtBQUV0QyxlQUFlQSxNQUFNLENBQUNDLE1BQU87QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFhQyxLQUFLLElBQUs7RUFBQUosYUFBQSxHQUFBSyxDQUFBO0VBQUFMLGFBQUEsR0FBQU0sQ0FBQTtFQUFBLE9BQUFGLEtBQUssQ0FBQ0csS0FBSyxDQUFDQyxZQUFZO0FBQUQsQ0FBRTtBQUNoRDtBQUNBO0FBQ0E7QUFDQSxlQUFnQkosS0FBSyxJQUFLO0VBQUFKLGFBQUEsR0FBQUssQ0FBQTtFQUFBTCxhQUFBLEdBQUFNLENBQUE7RUFBQSxPQUFBRixLQUFLLENBQUNHLEtBQUssQ0FBQ0UsU0FBUyxDQUFDLENBQUMsQ0FBQztBQUFELENBQUU7QUFDbkQsQ0FBQyJ9