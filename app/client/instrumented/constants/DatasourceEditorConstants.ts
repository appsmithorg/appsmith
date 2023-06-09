function cov_1d6xwdruln() {
  var path = "/Users/apple/github/appsmith/app/client/src/constants/DatasourceEditorConstants.ts";
  var hash = "f0e3c32192232010a27cae06cd23d1c678d9a1c3";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/constants/DatasourceEditorConstants.ts",
    statementMap: {
      "0": {
        start: {
          line: 1,
          column: 35
        },
        end: {
          line: 1,
          column: 47
        }
      },
      "1": {
        start: {
          line: 2,
          column: 37
        },
        end: {
          line: 2,
          column: 69
        }
      },
      "2": {
        start: {
          line: 3,
          column: 27
        },
        end: {
          line: 3,
          column: 40
        }
      },
      "3": {
        start: {
          line: 4,
          column: 27
        },
        end: {
          line: 4,
          column: 40
        }
      },
      "4": {
        start: {
          line: 8,
          column: 40
        },
        end: {
          line: 81,
          column: 1
        }
      }
    },
    fnMap: {},
    branchMap: {},
    s: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "f0e3c32192232010a27cae06cd23d1c678d9a1c3"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1d6xwdruln = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1d6xwdruln();
export const DATASOURCE_CONSTANT = (cov_1d6xwdruln().s[0]++, "DATASOURCE");
export const APPSMITH_IP_ADDRESSES = (cov_1d6xwdruln().s[1]++, ["18.223.74.85", "3.131.104.27"]);
export const PRIMARY_KEY = (cov_1d6xwdruln().s[2]++, "primary key");
export const FOREIGN_KEY = (cov_1d6xwdruln().s[3]++, "foreign key");

/* NOTE: This is a default formData value, 
required to fix the missing config for an existing mongo query */
export const MongoDefaultActionConfig = (cov_1d6xwdruln().s[4]++, {
  actionConfiguration: {
    formData: {
      aggregate: {
        limit: {
          data: "10"
        },
        arrayPipelines: {
          data: ""
        }
      },
      delete: {
        limit: {
          data: "SINGLE"
        },
        query: {
          data: ""
        }
      },
      updateMany: {
        limit: {
          data: "SINGLE"
        },
        query: {
          data: ""
        },
        update: {
          data: ""
        }
      },
      smartSubstitution: {
        data: true
      },
      collection: {
        data: ""
      },
      find: {
        skip: {
          data: ""
        },
        query: {
          data: ""
        },
        sort: {
          data: ""
        },
        limit: {
          data: ""
        },
        projection: {
          data: ""
        }
      },
      insert: {
        documents: {
          data: ""
        }
      },
      count: {
        query: {
          data: ""
        }
      },
      distinct: {
        query: {
          data: ""
        },
        key: {
          data: ""
        }
      }
    }
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMWQ2eHdkcnVsbiIsImFjdHVhbENvdmVyYWdlIiwiREFUQVNPVVJDRV9DT05TVEFOVCIsInMiLCJBUFBTTUlUSF9JUF9BRERSRVNTRVMiLCJQUklNQVJZX0tFWSIsIkZPUkVJR05fS0VZIiwiTW9uZ29EZWZhdWx0QWN0aW9uQ29uZmlnIiwiYWN0aW9uQ29uZmlndXJhdGlvbiIsImZvcm1EYXRhIiwiYWdncmVnYXRlIiwibGltaXQiLCJkYXRhIiwiYXJyYXlQaXBlbGluZXMiLCJkZWxldGUiLCJxdWVyeSIsInVwZGF0ZU1hbnkiLCJ1cGRhdGUiLCJzbWFydFN1YnN0aXR1dGlvbiIsImNvbGxlY3Rpb24iLCJmaW5kIiwic2tpcCIsInNvcnQiLCJwcm9qZWN0aW9uIiwiaW5zZXJ0IiwiZG9jdW1lbnRzIiwiY291bnQiLCJkaXN0aW5jdCIsImtleSJdLCJzb3VyY2VzIjpbIkRhdGFzb3VyY2VFZGl0b3JDb25zdGFudHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IERBVEFTT1VSQ0VfQ09OU1RBTlQgPSBcIkRBVEFTT1VSQ0VcIjtcbmV4cG9ydCBjb25zdCBBUFBTTUlUSF9JUF9BRERSRVNTRVMgPSBbXCIxOC4yMjMuNzQuODVcIiwgXCIzLjEzMS4xMDQuMjdcIl07XG5leHBvcnQgY29uc3QgUFJJTUFSWV9LRVkgPSBcInByaW1hcnkga2V5XCI7XG5leHBvcnQgY29uc3QgRk9SRUlHTl9LRVkgPSBcImZvcmVpZ24ga2V5XCI7XG5cbi8qIE5PVEU6IFRoaXMgaXMgYSBkZWZhdWx0IGZvcm1EYXRhIHZhbHVlLCBcbnJlcXVpcmVkIHRvIGZpeCB0aGUgbWlzc2luZyBjb25maWcgZm9yIGFuIGV4aXN0aW5nIG1vbmdvIHF1ZXJ5ICovXG5leHBvcnQgY29uc3QgTW9uZ29EZWZhdWx0QWN0aW9uQ29uZmlnID0ge1xuICBhY3Rpb25Db25maWd1cmF0aW9uOiB7XG4gICAgZm9ybURhdGE6IHtcbiAgICAgIGFnZ3JlZ2F0ZToge1xuICAgICAgICBsaW1pdDoge1xuICAgICAgICAgIGRhdGE6IFwiMTBcIixcbiAgICAgICAgfSxcbiAgICAgICAgYXJyYXlQaXBlbGluZXM6IHtcbiAgICAgICAgICBkYXRhOiBcIlwiLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGRlbGV0ZToge1xuICAgICAgICBsaW1pdDoge1xuICAgICAgICAgIGRhdGE6IFwiU0lOR0xFXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgZGF0YTogXCJcIixcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB1cGRhdGVNYW55OiB7XG4gICAgICAgIGxpbWl0OiB7XG4gICAgICAgICAgZGF0YTogXCJTSU5HTEVcIixcbiAgICAgICAgfSxcbiAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICBkYXRhOiBcIlwiLFxuICAgICAgICB9LFxuICAgICAgICB1cGRhdGU6IHtcbiAgICAgICAgICBkYXRhOiBcIlwiLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHNtYXJ0U3Vic3RpdHV0aW9uOiB7XG4gICAgICAgIGRhdGE6IHRydWUsXG4gICAgICB9LFxuICAgICAgY29sbGVjdGlvbjoge1xuICAgICAgICBkYXRhOiBcIlwiLFxuICAgICAgfSxcbiAgICAgIGZpbmQ6IHtcbiAgICAgICAgc2tpcDoge1xuICAgICAgICAgIGRhdGE6IFwiXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgZGF0YTogXCJcIixcbiAgICAgICAgfSxcbiAgICAgICAgc29ydDoge1xuICAgICAgICAgIGRhdGE6IFwiXCIsXG4gICAgICAgIH0sXG4gICAgICAgIGxpbWl0OiB7XG4gICAgICAgICAgZGF0YTogXCJcIixcbiAgICAgICAgfSxcbiAgICAgICAgcHJvamVjdGlvbjoge1xuICAgICAgICAgIGRhdGE6IFwiXCIsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgaW5zZXJ0OiB7XG4gICAgICAgIGRvY3VtZW50czoge1xuICAgICAgICAgIGRhdGE6IFwiXCIsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgY291bnQ6IHtcbiAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICBkYXRhOiBcIlwiLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGRpc3RpbmN0OiB7XG4gICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgZGF0YTogXCJcIixcbiAgICAgICAgfSxcbiAgICAgICAga2V5OiB7XG4gICAgICAgICAgZGF0YTogXCJcIixcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn07XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosT0FBTyxNQUFNRSxtQkFBbUIsSUFBQUYsY0FBQSxHQUFBRyxDQUFBLE9BQUcsWUFBWTtBQUMvQyxPQUFPLE1BQU1DLHFCQUFxQixJQUFBSixjQUFBLEdBQUFHLENBQUEsT0FBRyxDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUM7QUFDckUsT0FBTyxNQUFNRSxXQUFXLElBQUFMLGNBQUEsR0FBQUcsQ0FBQSxPQUFHLGFBQWE7QUFDeEMsT0FBTyxNQUFNRyxXQUFXLElBQUFOLGNBQUEsR0FBQUcsQ0FBQSxPQUFHLGFBQWE7O0FBRXhDO0FBQ0E7QUFDQSxPQUFPLE1BQU1JLHdCQUF3QixJQUFBUCxjQUFBLEdBQUFHLENBQUEsT0FBRztFQUN0Q0ssbUJBQW1CLEVBQUU7SUFDbkJDLFFBQVEsRUFBRTtNQUNSQyxTQUFTLEVBQUU7UUFDVEMsS0FBSyxFQUFFO1VBQ0xDLElBQUksRUFBRTtRQUNSLENBQUM7UUFDREMsY0FBYyxFQUFFO1VBQ2RELElBQUksRUFBRTtRQUNSO01BQ0YsQ0FBQztNQUNERSxNQUFNLEVBQUU7UUFDTkgsS0FBSyxFQUFFO1VBQ0xDLElBQUksRUFBRTtRQUNSLENBQUM7UUFDREcsS0FBSyxFQUFFO1VBQ0xILElBQUksRUFBRTtRQUNSO01BQ0YsQ0FBQztNQUNESSxVQUFVLEVBQUU7UUFDVkwsS0FBSyxFQUFFO1VBQ0xDLElBQUksRUFBRTtRQUNSLENBQUM7UUFDREcsS0FBSyxFQUFFO1VBQ0xILElBQUksRUFBRTtRQUNSLENBQUM7UUFDREssTUFBTSxFQUFFO1VBQ05MLElBQUksRUFBRTtRQUNSO01BQ0YsQ0FBQztNQUNETSxpQkFBaUIsRUFBRTtRQUNqQk4sSUFBSSxFQUFFO01BQ1IsQ0FBQztNQUNETyxVQUFVLEVBQUU7UUFDVlAsSUFBSSxFQUFFO01BQ1IsQ0FBQztNQUNEUSxJQUFJLEVBQUU7UUFDSkMsSUFBSSxFQUFFO1VBQ0pULElBQUksRUFBRTtRQUNSLENBQUM7UUFDREcsS0FBSyxFQUFFO1VBQ0xILElBQUksRUFBRTtRQUNSLENBQUM7UUFDRFUsSUFBSSxFQUFFO1VBQ0pWLElBQUksRUFBRTtRQUNSLENBQUM7UUFDREQsS0FBSyxFQUFFO1VBQ0xDLElBQUksRUFBRTtRQUNSLENBQUM7UUFDRFcsVUFBVSxFQUFFO1VBQ1ZYLElBQUksRUFBRTtRQUNSO01BQ0YsQ0FBQztNQUNEWSxNQUFNLEVBQUU7UUFDTkMsU0FBUyxFQUFFO1VBQ1RiLElBQUksRUFBRTtRQUNSO01BQ0YsQ0FBQztNQUNEYyxLQUFLLEVBQUU7UUFDTFgsS0FBSyxFQUFFO1VBQ0xILElBQUksRUFBRTtRQUNSO01BQ0YsQ0FBQztNQUNEZSxRQUFRLEVBQUU7UUFDUlosS0FBSyxFQUFFO1VBQ0xILElBQUksRUFBRTtRQUNSLENBQUM7UUFDRGdCLEdBQUcsRUFBRTtVQUNIaEIsSUFBSSxFQUFFO1FBQ1I7TUFDRjtJQUNGO0VBQ0Y7QUFDRixDQUFDIn0=