function cov_1i6whn5m02() {
  var path = "/Users/apple/github/appsmith/app/client/src/pages/Editor/GeneratePage/components/GeneratePageForm/styles.ts";
  var hash = "23445d09aba3667e691aea977e02dfe66663d575";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/pages/Editor/GeneratePage/components/GeneratePageForm/styles.ts",
    statementMap: {
      "0": {
        start: {
          line: 4,
          column: 29
        },
        end: {
          line: 12,
          column: 1
        }
      },
      "1": {
        start: {
          line: 7,
          column: 26
        },
        end: {
          line: 7,
          column: 37
        }
      },
      "2": {
        start: {
          line: 14,
          column: 21
        },
        end: {
          line: 21,
          column: 1
        }
      },
      "3": {
        start: {
          line: 23,
          column: 20
        },
        end: {
          line: 26,
          column: 1
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 7,
            column: 15
          },
          end: {
            line: 7,
            column: 16
          }
        },
        loc: {
          start: {
            line: 7,
            column: 26
          },
          end: {
            line: 7,
            column: 37
          }
        },
        line: 7
      }
    },
    branchMap: {},
    s: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0
    },
    f: {
      "0": 0
    },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "23445d09aba3667e691aea977e02dfe66663d575"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1i6whn5m02 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1i6whn5m02();
import styled from "styled-components";
import { getTypographyByKey } from "design-system-old";
export const SelectWrapper = (cov_1i6whn5m02().s[0]++, styled.div < {
  width: string
} > `
  display: inline-block;
  margin: 8px 0;
  max-width: ${props => {
  cov_1i6whn5m02().f[0]++;
  cov_1i6whn5m02().s[1]++;
  return props.width;
}};
  width: 100%;
  &:first-child {
    margin-top: 16px;
  }
`);
export const Label = (cov_1i6whn5m02().s[2]++, styled.p`
  flex: 1;
  ${getTypographyByKey("p1")};
  white-space: nowrap;
  display: flex;
  align-items: center;
  margin-bottom: 4px;
`);
export const Bold = (cov_1i6whn5m02().s[3]++, styled.span`
  font-weight: 500;
  /* margin-left: 2px; */
`);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMWk2d2huNW0wMiIsImFjdHVhbENvdmVyYWdlIiwic3R5bGVkIiwiZ2V0VHlwb2dyYXBoeUJ5S2V5IiwiU2VsZWN0V3JhcHBlciIsInMiLCJkaXYiLCJ3aWR0aCIsInN0cmluZyIsInByb3BzIiwiZiIsIkxhYmVsIiwicCIsIkJvbGQiLCJzcGFuIl0sInNvdXJjZXMiOlsic3R5bGVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzdHlsZWQgZnJvbSBcInN0eWxlZC1jb21wb25lbnRzXCI7XG5pbXBvcnQgeyBnZXRUeXBvZ3JhcGh5QnlLZXkgfSBmcm9tIFwiZGVzaWduLXN5c3RlbS1vbGRcIjtcblxuZXhwb3J0IGNvbnN0IFNlbGVjdFdyYXBwZXIgPSBzdHlsZWQuZGl2PHsgd2lkdGg6IHN0cmluZyB9PmBcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICBtYXJnaW46IDhweCAwO1xuICBtYXgtd2lkdGg6ICR7KHByb3BzKSA9PiBwcm9wcy53aWR0aH07XG4gIHdpZHRoOiAxMDAlO1xuICAmOmZpcnN0LWNoaWxkIHtcbiAgICBtYXJnaW4tdG9wOiAxNnB4O1xuICB9XG5gO1xuXG5leHBvcnQgY29uc3QgTGFiZWwgPSBzdHlsZWQucGBcbiAgZmxleDogMTtcbiAgJHtnZXRUeXBvZ3JhcGh5QnlLZXkoXCJwMVwiKX07XG4gIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIG1hcmdpbi1ib3R0b206IDRweDtcbmA7XG5cbmV4cG9ydCBjb25zdCBCb2xkID0gc3R5bGVkLnNwYW5gXG4gIGZvbnQtd2VpZ2h0OiA1MDA7XG4gIC8qIG1hcmdpbi1sZWZ0OiAycHg7ICovXG5gO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixPQUFPRSxNQUFNLE1BQU0sbUJBQW1CO0FBQ3RDLFNBQVNDLGtCQUFrQixRQUFRLG1CQUFtQjtBQUV0RCxPQUFPLE1BQU1DLGFBQWEsSUFBQUosY0FBQSxHQUFBSyxDQUFBLE9BQUdILE1BQU0sQ0FBQ0ksR0FBRyxHQUFDO0VBQUVDLEtBQUssRUFBRUM7QUFBTyxDQUFDLEdBQUU7QUFDM0Q7QUFDQTtBQUNBLGVBQWdCQyxLQUFLLElBQUs7RUFBQVQsY0FBQSxHQUFBVSxDQUFBO0VBQUFWLGNBQUEsR0FBQUssQ0FBQTtFQUFBLE9BQUFJLEtBQUssQ0FBQ0YsS0FBSztBQUFELENBQUU7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBRUQsT0FBTyxNQUFNSSxLQUFLLElBQUFYLGNBQUEsR0FBQUssQ0FBQSxPQUFHSCxNQUFNLENBQUNVLENBQUU7QUFDOUI7QUFDQSxJQUFJVCxrQkFBa0IsQ0FBQyxJQUFJLENBQUU7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBRUQsT0FBTyxNQUFNVSxJQUFJLElBQUFiLGNBQUEsR0FBQUssQ0FBQSxPQUFHSCxNQUFNLENBQUNZLElBQUs7QUFDaEM7QUFDQTtBQUNBLENBQUMifQ==