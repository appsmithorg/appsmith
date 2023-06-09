function cov_1l48t4nm16() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/TabsWidget/widget/derived.js";
  var hash = "97483ac7985928d649a9b043891a450da993327f";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/TabsWidget/widget/derived.js",
    statementMap: {
      "0": {
        start: {
          line: 4,
          column: 4
        },
        end: {
          line: 8,
          column: 5
        }
      },
      "1": {
        start: {
          line: 5,
          column: 6
        },
        end: {
          line: 7,
          column: 15
        }
      },
      "2": {
        start: {
          line: 10,
          column: 30
        },
        end: {
          line: 12,
          column: 12
        }
      },
      "3": {
        start: {
          line: 11,
          column: 15
        },
        end: {
          line: 11,
          column: 45
        }
      },
      "4": {
        start: {
          line: 13,
          column: 4
        },
        end: {
          line: 15,
          column: 5
        }
      },
      "5": {
        start: {
          line: 14,
          column: 6
        },
        end: {
          line: 14,
          column: 30
        }
      },
      "6": {
        start: {
          line: 16,
          column: 22
        },
        end: {
          line: 16,
          column: 50
        }
      },
      "7": {
        start: {
          line: 17,
          column: 4
        },
        end: {
          line: 17,
          column: 54
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 3,
            column: 18
          },
          end: {
            line: 3,
            column: 19
          }
        },
        loc: {
          start: {
            line: 3,
            column: 40
          },
          end: {
            line: 18,
            column: 3
          }
        },
        line: 3
      },
      "1": {
        name: "(anonymous_1)",
        decl: {
          start: {
            line: 11,
            column: 6
          },
          end: {
            line: 11,
            column: 7
          }
        },
        loc: {
          start: {
            line: 11,
            column: 15
          },
          end: {
            line: 11,
            column: 45
          }
        },
        line: 11
      }
    },
    branchMap: {
      "0": {
        loc: {
          start: {
            line: 4,
            column: 4
          },
          end: {
            line: 8,
            column: 5
          }
        },
        type: "if",
        locations: [{
          start: {
            line: 4,
            column: 4
          },
          end: {
            line: 8,
            column: 5
          }
        }, {
          start: {
            line: 4,
            column: 4
          },
          end: {
            line: 8,
            column: 5
          }
        }],
        line: 4
      },
      "1": {
        loc: {
          start: {
            line: 13,
            column: 4
          },
          end: {
            line: 15,
            column: 5
          }
        },
        type: "if",
        locations: [{
          start: {
            line: 13,
            column: 4
          },
          end: {
            line: 15,
            column: 5
          }
        }, {
          start: {
            line: 13,
            column: 4
          },
          end: {
            line: 15,
            column: 5
          }
        }],
        line: 13
      },
      "2": {
        loc: {
          start: {
            line: 17,
            column: 11
          },
          end: {
            line: 17,
            column: 53
          }
        },
        type: "cond-expr",
        locations: [{
          start: {
            line: 17,
            column: 30
          },
          end: {
            line: 17,
            column: 48
          }
        }, {
          start: {
            line: 17,
            column: 51
          },
          end: {
            line: 17,
            column: 53
          }
        }],
        line: 17
      }
    },
    s: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "6": 0,
      "7": 0
    },
    f: {
      "0": 0,
      "1": 0
    },
    b: {
      "0": [0, 0],
      "1": [0, 0],
      "2": [0, 0]
    },
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "97483ac7985928d649a9b043891a450da993327f"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1l48t4nm16 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1l48t4nm16();
/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getSelectedTab: (props, moment, _) => {
    cov_1l48t4nm16().f[0]++;
    cov_1l48t4nm16().s[0]++;
    if (props.selectedTabWidgetId) {
      cov_1l48t4nm16().b[0][0]++;
      cov_1l48t4nm16().s[1]++;
      return _.find(Object.values(props.tabsObj), {
        widgetId: props.selectedTabWidgetId
      }).label;
    } else {
      cov_1l48t4nm16().b[0][1]++;
    }
    const isDefaultTabExist = (cov_1l48t4nm16().s[2]++, Object.values(props.tabsObj).filter(tab => {
      cov_1l48t4nm16().f[1]++;
      cov_1l48t4nm16().s[3]++;
      return tab.label === props.defaultTab;
    }).length);
    cov_1l48t4nm16().s[4]++;
    if (isDefaultTabExist) {
      cov_1l48t4nm16().b[1][0]++;
      cov_1l48t4nm16().s[5]++;
      return props.defaultTab;
    } else {
      cov_1l48t4nm16().b[1][1]++;
    }
    const tabLabels = (cov_1l48t4nm16().s[6]++, Object.values(props.tabsObj));
    cov_1l48t4nm16().s[7]++;
    return tabLabels.length ? (cov_1l48t4nm16().b[2][0]++, tabLabels[0].label) : (cov_1l48t4nm16().b[2][1]++, "");
  }
  //
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMWw0OHQ0bm0xNiIsImFjdHVhbENvdmVyYWdlIiwiZ2V0U2VsZWN0ZWRUYWIiLCJwcm9wcyIsIm1vbWVudCIsIl8iLCJmIiwicyIsInNlbGVjdGVkVGFiV2lkZ2V0SWQiLCJiIiwiZmluZCIsIk9iamVjdCIsInZhbHVlcyIsInRhYnNPYmoiLCJ3aWRnZXRJZCIsImxhYmVsIiwiaXNEZWZhdWx0VGFiRXhpc3QiLCJmaWx0ZXIiLCJ0YWIiLCJkZWZhdWx0VGFiIiwibGVuZ3RoIiwidGFiTGFiZWxzIl0sInNvdXJjZXMiOlsiZGVyaXZlZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnMqL1xuZXhwb3J0IGRlZmF1bHQge1xuICBnZXRTZWxlY3RlZFRhYjogKHByb3BzLCBtb21lbnQsIF8pID0+IHtcbiAgICBpZiAocHJvcHMuc2VsZWN0ZWRUYWJXaWRnZXRJZCkge1xuICAgICAgcmV0dXJuIF8uZmluZChPYmplY3QudmFsdWVzKHByb3BzLnRhYnNPYmopLCB7XG4gICAgICAgIHdpZGdldElkOiBwcm9wcy5zZWxlY3RlZFRhYldpZGdldElkLFxuICAgICAgfSkubGFiZWw7XG4gICAgfVxuXG4gICAgY29uc3QgaXNEZWZhdWx0VGFiRXhpc3QgPSBPYmplY3QudmFsdWVzKHByb3BzLnRhYnNPYmopLmZpbHRlcihcbiAgICAgICh0YWIpID0+IHRhYi5sYWJlbCA9PT0gcHJvcHMuZGVmYXVsdFRhYixcbiAgICApLmxlbmd0aDtcbiAgICBpZiAoaXNEZWZhdWx0VGFiRXhpc3QpIHtcbiAgICAgIHJldHVybiBwcm9wcy5kZWZhdWx0VGFiO1xuICAgIH1cbiAgICBjb25zdCB0YWJMYWJlbHMgPSBPYmplY3QudmFsdWVzKHByb3BzLnRhYnNPYmopO1xuICAgIHJldHVybiB0YWJMYWJlbHMubGVuZ3RoID8gdGFiTGFiZWxzWzBdLmxhYmVsIDogXCJcIjtcbiAgfSxcbiAgLy9cbn07XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlo7QUFDQSxlQUFlO0VBQ2JFLGNBQWMsRUFBRUEsQ0FBQ0MsS0FBSyxFQUFFQyxNQUFNLEVBQUVDLENBQUMsS0FBSztJQUFBTCxjQUFBLEdBQUFNLENBQUE7SUFBQU4sY0FBQSxHQUFBTyxDQUFBO0lBQ3BDLElBQUlKLEtBQUssQ0FBQ0ssbUJBQW1CLEVBQUU7TUFBQVIsY0FBQSxHQUFBUyxDQUFBO01BQUFULGNBQUEsR0FBQU8sQ0FBQTtNQUM3QixPQUFPRixDQUFDLENBQUNLLElBQUksQ0FBQ0MsTUFBTSxDQUFDQyxNQUFNLENBQUNULEtBQUssQ0FBQ1UsT0FBTyxDQUFDLEVBQUU7UUFDMUNDLFFBQVEsRUFBRVgsS0FBSyxDQUFDSztNQUNsQixDQUFDLENBQUMsQ0FBQ08sS0FBSztJQUNWLENBQUM7TUFBQWYsY0FBQSxHQUFBUyxDQUFBO0lBQUE7SUFFRCxNQUFNTyxpQkFBaUIsSUFBQWhCLGNBQUEsR0FBQU8sQ0FBQSxPQUFHSSxNQUFNLENBQUNDLE1BQU0sQ0FBQ1QsS0FBSyxDQUFDVSxPQUFPLENBQUMsQ0FBQ0ksTUFBTSxDQUMxREMsR0FBRyxJQUFLO01BQUFsQixjQUFBLEdBQUFNLENBQUE7TUFBQU4sY0FBQSxHQUFBTyxDQUFBO01BQUEsT0FBQVcsR0FBRyxDQUFDSCxLQUFLLEtBQUtaLEtBQUssQ0FBQ2dCLFVBQVU7SUFBRCxDQUN4QyxDQUFDLENBQUNDLE1BQU07SUFBQ3BCLGNBQUEsR0FBQU8sQ0FBQTtJQUNULElBQUlTLGlCQUFpQixFQUFFO01BQUFoQixjQUFBLEdBQUFTLENBQUE7TUFBQVQsY0FBQSxHQUFBTyxDQUFBO01BQ3JCLE9BQU9KLEtBQUssQ0FBQ2dCLFVBQVU7SUFDekIsQ0FBQztNQUFBbkIsY0FBQSxHQUFBUyxDQUFBO0lBQUE7SUFDRCxNQUFNWSxTQUFTLElBQUFyQixjQUFBLEdBQUFPLENBQUEsT0FBR0ksTUFBTSxDQUFDQyxNQUFNLENBQUNULEtBQUssQ0FBQ1UsT0FBTyxDQUFDO0lBQUNiLGNBQUEsR0FBQU8sQ0FBQTtJQUMvQyxPQUFPYyxTQUFTLENBQUNELE1BQU0sSUFBQXBCLGNBQUEsR0FBQVMsQ0FBQSxVQUFHWSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUNOLEtBQUssS0FBQWYsY0FBQSxHQUFBUyxDQUFBLFVBQUcsRUFBRTtFQUNuRDtFQUNBO0FBQ0YsQ0FBQyJ9