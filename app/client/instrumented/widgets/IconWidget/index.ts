function cov_n0tq9hn1w() {
  var path = "/Users/apple/github/appsmith/app/client/src/widgets/IconWidget/index.ts";
  var hash = "80e1fb60a99e0b61b82eecf08117bc622899026f";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/widgets/IconWidget/index.ts",
    statementMap: {
      "0": {
        start: {
          line: 4,
          column: 22
        },
        end: {
          line: 24,
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
    hash: "80e1fb60a99e0b61b82eecf08117bc622899026f"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_n0tq9hn1w = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_n0tq9hn1w();
import IconSVG from "./icon.svg";
import Widget from "./widget";
export const CONFIG = (cov_n0tq9hn1w().s[0]++, {
  type: Widget.getWidgetType(),
  name: "Icon",
  iconSVG: IconSVG,
  hideCard: true,
  isDeprecated: true,
  replacement: "ICON_BUTTON_WIDGET",
  defaults: {
    widgetName: "Icon",
    rows: 4,
    columns: 4,
    version: 1
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions()
  }
});
export default Widget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfbjB0cTlobjF3IiwiYWN0dWFsQ292ZXJhZ2UiLCJJY29uU1ZHIiwiV2lkZ2V0IiwiQ09ORklHIiwicyIsInR5cGUiLCJnZXRXaWRnZXRUeXBlIiwibmFtZSIsImljb25TVkciLCJoaWRlQ2FyZCIsImlzRGVwcmVjYXRlZCIsInJlcGxhY2VtZW50IiwiZGVmYXVsdHMiLCJ3aWRnZXROYW1lIiwicm93cyIsImNvbHVtbnMiLCJ2ZXJzaW9uIiwicHJvcGVydGllcyIsImRlcml2ZWQiLCJnZXREZXJpdmVkUHJvcGVydGllc01hcCIsImRlZmF1bHQiLCJnZXREZWZhdWx0UHJvcGVydGllc01hcCIsIm1ldGEiLCJnZXRNZXRhUHJvcGVydGllc01hcCIsImNvbmZpZyIsImdldFByb3BlcnR5UGFuZUNvbmZpZyIsImF1dG9jb21wbGV0ZURlZmluaXRpb25zIiwiZ2V0QXV0b2NvbXBsZXRlRGVmaW5pdGlvbnMiXSwic291cmNlcyI6WyJpbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgSWNvblNWRyBmcm9tIFwiLi9pY29uLnN2Z1wiO1xuaW1wb3J0IFdpZGdldCBmcm9tIFwiLi93aWRnZXRcIjtcblxuZXhwb3J0IGNvbnN0IENPTkZJRyA9IHtcbiAgdHlwZTogV2lkZ2V0LmdldFdpZGdldFR5cGUoKSxcbiAgbmFtZTogXCJJY29uXCIsXG4gIGljb25TVkc6IEljb25TVkcsXG4gIGhpZGVDYXJkOiB0cnVlLFxuICBpc0RlcHJlY2F0ZWQ6IHRydWUsXG4gIHJlcGxhY2VtZW50OiBcIklDT05fQlVUVE9OX1dJREdFVFwiLFxuICBkZWZhdWx0czoge1xuICAgIHdpZGdldE5hbWU6IFwiSWNvblwiLFxuICAgIHJvd3M6IDQsXG4gICAgY29sdW1uczogNCxcbiAgICB2ZXJzaW9uOiAxLFxuICB9LFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgZGVyaXZlZDogV2lkZ2V0LmdldERlcml2ZWRQcm9wZXJ0aWVzTWFwKCksXG4gICAgZGVmYXVsdDogV2lkZ2V0LmdldERlZmF1bHRQcm9wZXJ0aWVzTWFwKCksXG4gICAgbWV0YTogV2lkZ2V0LmdldE1ldGFQcm9wZXJ0aWVzTWFwKCksXG4gICAgY29uZmlnOiBXaWRnZXQuZ2V0UHJvcGVydHlQYW5lQ29uZmlnKCksXG4gICAgYXV0b2NvbXBsZXRlRGVmaW5pdGlvbnM6IFdpZGdldC5nZXRBdXRvY29tcGxldGVEZWZpbml0aW9ucygpLFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgV2lkZ2V0O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGFBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGFBQUE7QUFmWixPQUFPRSxPQUFPLE1BQU0sWUFBWTtBQUNoQyxPQUFPQyxNQUFNLE1BQU0sVUFBVTtBQUU3QixPQUFPLE1BQU1DLE1BQU0sSUFBQUosYUFBQSxHQUFBSyxDQUFBLE9BQUc7RUFDcEJDLElBQUksRUFBRUgsTUFBTSxDQUFDSSxhQUFhLENBQUMsQ0FBQztFQUM1QkMsSUFBSSxFQUFFLE1BQU07RUFDWkMsT0FBTyxFQUFFUCxPQUFPO0VBQ2hCUSxRQUFRLEVBQUUsSUFBSTtFQUNkQyxZQUFZLEVBQUUsSUFBSTtFQUNsQkMsV0FBVyxFQUFFLG9CQUFvQjtFQUNqQ0MsUUFBUSxFQUFFO0lBQ1JDLFVBQVUsRUFBRSxNQUFNO0lBQ2xCQyxJQUFJLEVBQUUsQ0FBQztJQUNQQyxPQUFPLEVBQUUsQ0FBQztJQUNWQyxPQUFPLEVBQUU7RUFDWCxDQUFDO0VBQ0RDLFVBQVUsRUFBRTtJQUNWQyxPQUFPLEVBQUVoQixNQUFNLENBQUNpQix1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxPQUFPLEVBQUVsQixNQUFNLENBQUNtQix1QkFBdUIsQ0FBQyxDQUFDO0lBQ3pDQyxJQUFJLEVBQUVwQixNQUFNLENBQUNxQixvQkFBb0IsQ0FBQyxDQUFDO0lBQ25DQyxNQUFNLEVBQUV0QixNQUFNLENBQUN1QixxQkFBcUIsQ0FBQyxDQUFDO0lBQ3RDQyx1QkFBdUIsRUFBRXhCLE1BQU0sQ0FBQ3lCLDBCQUEwQixDQUFDO0VBQzdEO0FBQ0YsQ0FBQztBQUVELGVBQWV6QixNQUFNIn0=