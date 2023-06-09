function cov_sjr9xcjxo() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/ListWidgetV2/widget/derived.js";
  var hash = "865367af111f541567534f47e773a92d14e4d627";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/ListWidgetV2/widget/derived.js",
    statementMap: {
      "0": {
        start: {
          line: 4,
          column: 24
        },
        end: {
          line: 4,
          column: 49
        }
      },
      "1": {
        start: {
          line: 5,
          column: 24
        },
        end: {
          line: 5,
          column: 51
        }
      },
      "2": {
        start: {
          line: 7,
          column: 25
        },
        end: {
          line: 7,
          column: 70
        }
      },
      "3": {
        start: {
          line: 9,
          column: 4
        },
        end: {
          line: 19,
          column: 5
        }
      },
      "4": {
        start: {
          line: 10,
          column: 21
        },
        end: {
          line: 10,
          column: 49
        }
      },
      "5": {
        start: {
          line: 12,
          column: 6
        },
        end: {
          line: 18,
          column: 9
        }
      },
      "6": {
        start: {
          line: 13,
          column: 8
        },
        end: {
          line: 17,
          column: 10
        }
      },
      "7": {
        start: {
          line: 21,
          column: 4
        },
        end: {
          line: 21,
          column: 24
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 3,
            column: 24
          },
          end: {
            line: 3,
            column: 25
          }
        },
        loc: {
          start: {
            line: 3,
            column: 46
          },
          end: {
            line: 22,
            column: 3
          }
        },
        line: 3
      },
      "1": {
        name: "(anonymous_1)",
        decl: {
          start: {
            line: 12,
            column: 21
          },
          end: {
            line: 12,
            column: 22
          }
        },
        loc: {
          start: {
            line: 12,
            column: 32
          },
          end: {
            line: 18,
            column: 7
          }
        },
        line: 12
      }
    },
    branchMap: {
      "0": {
        loc: {
          start: {
            line: 4,
            column: 24
          },
          end: {
            line: 4,
            column: 49
          }
        },
        type: "binary-expr",
        locations: [{
          start: {
            line: 4,
            column: 24
          },
          end: {
            line: 4,
            column: 43
          }
        }, {
          start: {
            line: 4,
            column: 47
          },
          end: {
            line: 4,
            column: 49
          }
        }],
        line: 4
      },
      "1": {
        loc: {
          start: {
            line: 9,
            column: 4
          },
          end: {
            line: 19,
            column: 5
          }
        },
        type: "if",
        locations: [{
          start: {
            line: 9,
            column: 4
          },
          end: {
            line: 19,
            column: 5
          }
        }, {
          start: {
            line: 9,
            column: 4
          },
          end: {
            line: 19,
            column: 5
          }
        }],
        line: 9
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
      "1": [0, 0]
    },
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "865367af111f541567534f47e773a92d14e4d627"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_sjr9xcjxo = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_sjr9xcjxo();
/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getChildAutoComplete: (props, moment, _) => {
    cov_sjr9xcjxo().f[0]++;
    const currentItem = (cov_sjr9xcjxo().s[0]++, (cov_sjr9xcjxo().b[0][0]++, props.listData?.[0]) ?? (cov_sjr9xcjxo().b[0][1]++, {}));
    const currentView = (cov_sjr9xcjxo().s[1]++, props.currentItemsView?.[0]);
    const autocomplete = (cov_sjr9xcjxo().s[2]++, {
      currentItem,
      currentIndex: 0,
      currentView
    });
    cov_sjr9xcjxo().s[3]++;
    if (props.levelData) {
      cov_sjr9xcjxo().b[1][0]++;
      const levels = (cov_sjr9xcjxo().s[4]++, Object.keys(props.levelData));
      cov_sjr9xcjxo().s[5]++;
      levels.forEach(level => {
        cov_sjr9xcjxo().f[1]++;
        cov_sjr9xcjxo().s[6]++;
        autocomplete[level] = {
          currentIndex: 0,
          currentItem: props.levelData[level].autocomplete.currentItem,
          currentView: props.levelData[level].autocomplete.currentView
        };
      });
    } else {
      cov_sjr9xcjxo().b[1][1]++;
    }
    cov_sjr9xcjxo().s[7]++;
    return autocomplete;
  }
  //
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3Zfc2pyOXhjanhvIiwiYWN0dWFsQ292ZXJhZ2UiLCJnZXRDaGlsZEF1dG9Db21wbGV0ZSIsInByb3BzIiwibW9tZW50IiwiXyIsImYiLCJjdXJyZW50SXRlbSIsInMiLCJiIiwibGlzdERhdGEiLCJjdXJyZW50VmlldyIsImN1cnJlbnRJdGVtc1ZpZXciLCJhdXRvY29tcGxldGUiLCJjdXJyZW50SW5kZXgiLCJsZXZlbERhdGEiLCJsZXZlbHMiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsImxldmVsIl0sInNvdXJjZXMiOlsiZGVyaXZlZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnMqL1xuZXhwb3J0IGRlZmF1bHQge1xuICBnZXRDaGlsZEF1dG9Db21wbGV0ZTogKHByb3BzLCBtb21lbnQsIF8pID0+IHtcbiAgICBjb25zdCBjdXJyZW50SXRlbSA9IHByb3BzLmxpc3REYXRhPy5bMF0gPz8ge307XG4gICAgY29uc3QgY3VycmVudFZpZXcgPSBwcm9wcy5jdXJyZW50SXRlbXNWaWV3Py5bMF07XG5cbiAgICBjb25zdCBhdXRvY29tcGxldGUgPSB7IGN1cnJlbnRJdGVtLCBjdXJyZW50SW5kZXg6IDAsIGN1cnJlbnRWaWV3IH07XG5cbiAgICBpZiAocHJvcHMubGV2ZWxEYXRhKSB7XG4gICAgICBjb25zdCBsZXZlbHMgPSBPYmplY3Qua2V5cyhwcm9wcy5sZXZlbERhdGEpO1xuXG4gICAgICBsZXZlbHMuZm9yRWFjaCgobGV2ZWwpID0+IHtcbiAgICAgICAgYXV0b2NvbXBsZXRlW2xldmVsXSA9IHtcbiAgICAgICAgICBjdXJyZW50SW5kZXg6IDAsXG4gICAgICAgICAgY3VycmVudEl0ZW06IHByb3BzLmxldmVsRGF0YVtsZXZlbF0uYXV0b2NvbXBsZXRlLmN1cnJlbnRJdGVtLFxuICAgICAgICAgIGN1cnJlbnRWaWV3OiBwcm9wcy5sZXZlbERhdGFbbGV2ZWxdLmF1dG9jb21wbGV0ZS5jdXJyZW50VmlldyxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBhdXRvY29tcGxldGU7XG4gIH0sXG4gIC8vXG59O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxhQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxhQUFBO0FBZlo7QUFDQSxlQUFlO0VBQ2JFLG9CQUFvQixFQUFFQSxDQUFDQyxLQUFLLEVBQUVDLE1BQU0sRUFBRUMsQ0FBQyxLQUFLO0lBQUFMLGFBQUEsR0FBQU0sQ0FBQTtJQUMxQyxNQUFNQyxXQUFXLElBQUFQLGFBQUEsR0FBQVEsQ0FBQSxPQUFHLENBQUFSLGFBQUEsR0FBQVMsQ0FBQSxVQUFBTixLQUFLLENBQUNPLFFBQVEsR0FBRyxDQUFDLENBQUMsTUFBQVYsYUFBQSxHQUFBUyxDQUFBLFVBQUksQ0FBQyxDQUFDO0lBQzdDLE1BQU1FLFdBQVcsSUFBQVgsYUFBQSxHQUFBUSxDQUFBLE9BQUdMLEtBQUssQ0FBQ1MsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO0lBRS9DLE1BQU1DLFlBQVksSUFBQWIsYUFBQSxHQUFBUSxDQUFBLE9BQUc7TUFBRUQsV0FBVztNQUFFTyxZQUFZLEVBQUUsQ0FBQztNQUFFSDtJQUFZLENBQUM7SUFBQ1gsYUFBQSxHQUFBUSxDQUFBO0lBRW5FLElBQUlMLEtBQUssQ0FBQ1ksU0FBUyxFQUFFO01BQUFmLGFBQUEsR0FBQVMsQ0FBQTtNQUNuQixNQUFNTyxNQUFNLElBQUFoQixhQUFBLEdBQUFRLENBQUEsT0FBR1MsTUFBTSxDQUFDQyxJQUFJLENBQUNmLEtBQUssQ0FBQ1ksU0FBUyxDQUFDO01BQUNmLGFBQUEsR0FBQVEsQ0FBQTtNQUU1Q1EsTUFBTSxDQUFDRyxPQUFPLENBQUVDLEtBQUssSUFBSztRQUFBcEIsYUFBQSxHQUFBTSxDQUFBO1FBQUFOLGFBQUEsR0FBQVEsQ0FBQTtRQUN4QkssWUFBWSxDQUFDTyxLQUFLLENBQUMsR0FBRztVQUNwQk4sWUFBWSxFQUFFLENBQUM7VUFDZlAsV0FBVyxFQUFFSixLQUFLLENBQUNZLFNBQVMsQ0FBQ0ssS0FBSyxDQUFDLENBQUNQLFlBQVksQ0FBQ04sV0FBVztVQUM1REksV0FBVyxFQUFFUixLQUFLLENBQUNZLFNBQVMsQ0FBQ0ssS0FBSyxDQUFDLENBQUNQLFlBQVksQ0FBQ0Y7UUFDbkQsQ0FBQztNQUNILENBQUMsQ0FBQztJQUNKLENBQUM7TUFBQVgsYUFBQSxHQUFBUyxDQUFBO0lBQUE7SUFBQVQsYUFBQSxHQUFBUSxDQUFBO0lBRUQsT0FBT0ssWUFBWTtFQUNyQjtFQUNBO0FBQ0YsQ0FBQyJ9