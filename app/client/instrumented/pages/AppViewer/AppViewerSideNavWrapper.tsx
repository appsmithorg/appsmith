function cov_15exfbysw8() {
  var path = "/Users/apple/github/appsmith/app/client/src/pages/AppViewer/AppViewerSideNavWrapper.tsx";
  var hash = "6e3b4b7f9748096f19a2cccab3a8749e6870f32e";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/pages/AppViewer/AppViewerSideNavWrapper.tsx",
    statementMap: {
      "0": {
        start: {
          line: 3,
          column: 27
        },
        end: {
          line: 3,
          column: 52
        }
      },
      "1": {
        start: {
          line: 7,
          column: 29
        },
        end: {
          line: 7,
          column: 54
        }
      },
      "2": {
        start: {
          line: 13,
          column: 29
        },
        end: {
          line: 13,
          column: 54
        }
      },
      "3": {
        start: {
          line: 14,
          column: 24
        },
        end: {
          line: 14,
          column: 55
        }
      },
      "4": {
        start: {
          line: 22,
          column: 30
        },
        end: {
          line: 22,
          column: 54
        }
      },
      "5": {
        start: {
          line: 24,
          column: 33
        },
        end: {
          line: 24,
          column: 70
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 3,
            column: 16
          },
          end: {
            line: 3,
            column: 17
          }
        },
        loc: {
          start: {
            line: 3,
            column: 27
          },
          end: {
            line: 3,
            column: 52
          }
        },
        line: 3
      },
      "1": {
        name: "(anonymous_1)",
        decl: {
          start: {
            line: 7,
            column: 18
          },
          end: {
            line: 7,
            column: 19
          }
        },
        loc: {
          start: {
            line: 7,
            column: 29
          },
          end: {
            line: 7,
            column: 54
          }
        },
        line: 7
      },
      "2": {
        name: "(anonymous_2)",
        decl: {
          start: {
            line: 13,
            column: 18
          },
          end: {
            line: 13,
            column: 19
          }
        },
        loc: {
          start: {
            line: 13,
            column: 29
          },
          end: {
            line: 13,
            column: 54
          }
        },
        line: 13
      },
      "3": {
        name: "(anonymous_3)",
        decl: {
          start: {
            line: 14,
            column: 13
          },
          end: {
            line: 14,
            column: 14
          }
        },
        loc: {
          start: {
            line: 14,
            column: 24
          },
          end: {
            line: 14,
            column: 55
          }
        },
        line: 14
      },
      "4": {
        name: "(anonymous_4)",
        decl: {
          start: {
            line: 22,
            column: 19
          },
          end: {
            line: 22,
            column: 20
          }
        },
        loc: {
          start: {
            line: 22,
            column: 30
          },
          end: {
            line: 22,
            column: 54
          }
        },
        line: 22
      },
      "5": {
        name: "(anonymous_5)",
        decl: {
          start: {
            line: 24,
            column: 22
          },
          end: {
            line: 24,
            column: 23
          }
        },
        loc: {
          start: {
            line: 24,
            column: 33
          },
          end: {
            line: 24,
            column: 70
          }
        },
        line: 24
      }
    },
    branchMap: {},
    s: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0
    },
    f: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0
    },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "6e3b4b7f9748096f19a2cccab3a8749e6870f32e"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_15exfbysw8 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_15exfbysw8();
import styled from "styled-components";
export default styled.div`
  background: ${props => {
  cov_15exfbysw8().f[0]++;
  cov_15exfbysw8().s[0]++;
  return props.theme.colors.paneBG;
}};
  & button.sidenav-toggle,
  & button.sidenav-toggle:hover,
  & button.sidenav-toggle:active {
    background: ${props => {
  cov_15exfbysw8().f[1]++;
  cov_15exfbysw8().s[1]++;
  return props.theme.colors.paneBG;
}};
    outline: none;
    border: none;
    border-radius: 0;
  }
  & ul {
    background: ${props => {
  cov_15exfbysw8().f[2]++;
  cov_15exfbysw8().s[2]++;
  return props.theme.colors.paneBG;
}};
    color: ${props => {
  cov_15exfbysw8().f[3]++;
  cov_15exfbysw8().s[3]++;
  return props.theme.colors.textOnDarkBG;
}};
    padding: 0;
    height: 100%;
    width: 100%;
    & li {
      padding: 0;
    }
    & li div.bp3-menu-item {
      font-size: ${props => {
  cov_15exfbysw8().f[4]++;
  cov_15exfbysw8().s[4]++;
  return props.theme.fontSizes[3];
}}px;
      &.bp3-intent-primary {
        background: ${props => {
  cov_15exfbysw8().f[5]++;
  cov_15exfbysw8().s[5]++;
  return props.theme.sideNav.activeItemBGColor;
}};
      }
      & > div {
        display: inline-block;
      }
    }
  }
`;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMTVleGZieXN3OCIsImFjdHVhbENvdmVyYWdlIiwic3R5bGVkIiwiZGl2IiwicHJvcHMiLCJmIiwicyIsInRoZW1lIiwiY29sb3JzIiwicGFuZUJHIiwidGV4dE9uRGFya0JHIiwiZm9udFNpemVzIiwic2lkZU5hdiIsImFjdGl2ZUl0ZW1CR0NvbG9yIl0sInNvdXJjZXMiOlsiQXBwVmlld2VyU2lkZU5hdldyYXBwZXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzdHlsZWQgZnJvbSBcInN0eWxlZC1jb21wb25lbnRzXCI7XG5leHBvcnQgZGVmYXVsdCBzdHlsZWQuZGl2YFxuICBiYWNrZ3JvdW5kOiAkeyhwcm9wcykgPT4gcHJvcHMudGhlbWUuY29sb3JzLnBhbmVCR307XG4gICYgYnV0dG9uLnNpZGVuYXYtdG9nZ2xlLFxuICAmIGJ1dHRvbi5zaWRlbmF2LXRvZ2dsZTpob3ZlcixcbiAgJiBidXR0b24uc2lkZW5hdi10b2dnbGU6YWN0aXZlIHtcbiAgICBiYWNrZ3JvdW5kOiAkeyhwcm9wcykgPT4gcHJvcHMudGhlbWUuY29sb3JzLnBhbmVCR307XG4gICAgb3V0bGluZTogbm9uZTtcbiAgICBib3JkZXI6IG5vbmU7XG4gICAgYm9yZGVyLXJhZGl1czogMDtcbiAgfVxuICAmIHVsIHtcbiAgICBiYWNrZ3JvdW5kOiAkeyhwcm9wcykgPT4gcHJvcHMudGhlbWUuY29sb3JzLnBhbmVCR307XG4gICAgY29sb3I6ICR7KHByb3BzKSA9PiBwcm9wcy50aGVtZS5jb2xvcnMudGV4dE9uRGFya0JHfTtcbiAgICBwYWRkaW5nOiAwO1xuICAgIGhlaWdodDogMTAwJTtcbiAgICB3aWR0aDogMTAwJTtcbiAgICAmIGxpIHtcbiAgICAgIHBhZGRpbmc6IDA7XG4gICAgfVxuICAgICYgbGkgZGl2LmJwMy1tZW51LWl0ZW0ge1xuICAgICAgZm9udC1zaXplOiAkeyhwcm9wcykgPT4gcHJvcHMudGhlbWUuZm9udFNpemVzWzNdfXB4O1xuICAgICAgJi5icDMtaW50ZW50LXByaW1hcnkge1xuICAgICAgICBiYWNrZ3JvdW5kOiAkeyhwcm9wcykgPT4gcHJvcHMudGhlbWUuc2lkZU5hdi5hY3RpdmVJdGVtQkdDb2xvcn07XG4gICAgICB9XG4gICAgICAmID4gZGl2IHtcbiAgICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuYDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosT0FBT0UsTUFBTSxNQUFNLG1CQUFtQjtBQUN0QyxlQUFlQSxNQUFNLENBQUNDLEdBQUk7QUFDMUIsZ0JBQWlCQyxLQUFLLElBQUs7RUFBQUosY0FBQSxHQUFBSyxDQUFBO0VBQUFMLGNBQUEsR0FBQU0sQ0FBQTtFQUFBLE9BQUFGLEtBQUssQ0FBQ0csS0FBSyxDQUFDQyxNQUFNLENBQUNDLE1BQU07QUFBRCxDQUFFO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBLGtCQUFtQkwsS0FBSyxJQUFLO0VBQUFKLGNBQUEsR0FBQUssQ0FBQTtFQUFBTCxjQUFBLEdBQUFNLENBQUE7RUFBQSxPQUFBRixLQUFLLENBQUNHLEtBQUssQ0FBQ0MsTUFBTSxDQUFDQyxNQUFNO0FBQUQsQ0FBRTtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQW1CTCxLQUFLLElBQUs7RUFBQUosY0FBQSxHQUFBSyxDQUFBO0VBQUFMLGNBQUEsR0FBQU0sQ0FBQTtFQUFBLE9BQUFGLEtBQUssQ0FBQ0csS0FBSyxDQUFDQyxNQUFNLENBQUNDLE1BQU07QUFBRCxDQUFFO0FBQ3ZELGFBQWNMLEtBQUssSUFBSztFQUFBSixjQUFBLEdBQUFLLENBQUE7RUFBQUwsY0FBQSxHQUFBTSxDQUFBO0VBQUEsT0FBQUYsS0FBSyxDQUFDRyxLQUFLLENBQUNDLE1BQU0sQ0FBQ0UsWUFBWTtBQUFELENBQUU7QUFDeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBb0JOLEtBQUssSUFBSztFQUFBSixjQUFBLEdBQUFLLENBQUE7RUFBQUwsY0FBQSxHQUFBTSxDQUFBO0VBQUEsT0FBQUYsS0FBSyxDQUFDRyxLQUFLLENBQUNJLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFBRCxDQUFFO0FBQ3ZEO0FBQ0Esc0JBQXVCUCxLQUFLLElBQUs7RUFBQUosY0FBQSxHQUFBSyxDQUFBO0VBQUFMLGNBQUEsR0FBQU0sQ0FBQTtFQUFBLE9BQUFGLEtBQUssQ0FBQ0csS0FBSyxDQUFDSyxPQUFPLENBQUNDLGlCQUFpQjtBQUFELENBQUU7QUFDdkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyJ9