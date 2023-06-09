function cov_10o58lswtk() {
  var path = "/Users/apple/github/appsmith/app/client/src/constants/WebsocketConstants.tsx";
  var hash = "c1e51e79835dddba9713be94accfc5cb0f08dc3d";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/constants/WebsocketConstants.tsx",
    statementMap: {
      "0": {
        start: {
          line: 1,
          column: 32
        },
        end: {
          line: 5,
          column: 1
        }
      },
      "1": {
        start: {
          line: 7,
          column: 39
        },
        end: {
          line: 9,
          column: 2
        }
      },
      "2": {
        start: {
          line: 7,
          column: 46
        },
        end: {
          line: 9,
          column: 1
        }
      },
      "3": {
        start: {
          line: 11,
          column: 42
        },
        end: {
          line: 13,
          column: 2
        }
      },
      "4": {
        start: {
          line: 11,
          column: 49
        },
        end: {
          line: 13,
          column: 1
        }
      },
      "5": {
        start: {
          line: 15,
          column: 39
        },
        end: {
          line: 17,
          column: 2
        }
      },
      "6": {
        start: {
          line: 15,
          column: 46
        },
        end: {
          line: 17,
          column: 1
        }
      },
      "7": {
        start: {
          line: 19,
          column: 29
        },
        end: {
          line: 19,
          column: 35
        }
      },
      "8": {
        start: {
          line: 20,
          column: 35
        },
        end: {
          line: 22,
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
            column: 39
          },
          end: {
            line: 7,
            column: 40
          }
        },
        loc: {
          start: {
            line: 7,
            column: 46
          },
          end: {
            line: 9,
            column: 1
          }
        },
        line: 7
      },
      "1": {
        name: "(anonymous_1)",
        decl: {
          start: {
            line: 11,
            column: 42
          },
          end: {
            line: 11,
            column: 43
          }
        },
        loc: {
          start: {
            line: 11,
            column: 49
          },
          end: {
            line: 13,
            column: 1
          }
        },
        line: 11
      },
      "2": {
        name: "(anonymous_2)",
        decl: {
          start: {
            line: 15,
            column: 39
          },
          end: {
            line: 15,
            column: 40
          }
        },
        loc: {
          start: {
            line: 15,
            column: 46
          },
          end: {
            line: 17,
            column: 1
          }
        },
        line: 15
      }
    },
    branchMap: {},
    s: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "6": 0,
      "7": 0,
      "8": 0
    },
    f: {
      "0": 0,
      "1": 0,
      "2": 0
    },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "c1e51e79835dddba9713be94accfc5cb0f08dc3d"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_10o58lswtk = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_10o58lswtk();
export const WEBSOCKET_EVENTS = (cov_10o58lswtk().s[0]++, {
  RECONNECT: "RECONNECT",
  DISCONNECTED: "DISCONNECTED",
  CONNECTED: "CONNECTED"
});
cov_10o58lswtk().s[1]++;
export const reconnectWebsocketEvent = () => {
  cov_10o58lswtk().f[0]++;
  cov_10o58lswtk().s[2]++;
  return {
    type: WEBSOCKET_EVENTS.RECONNECT
  };
};
cov_10o58lswtk().s[3]++;
export const websocketDisconnectedEvent = () => {
  cov_10o58lswtk().f[1]++;
  cov_10o58lswtk().s[4]++;
  return {
    type: WEBSOCKET_EVENTS.DISCONNECTED
  };
};
cov_10o58lswtk().s[5]++;
export const websocketConnectedEvent = () => {
  cov_10o58lswtk().f[2]++;
  cov_10o58lswtk().s[6]++;
  return {
    type: WEBSOCKET_EVENTS.CONNECTED
  };
};
export const RTS_BASE_PATH = (cov_10o58lswtk().s[7]++, "/rts");
export const WEBSOCKET_NAMESPACE = (cov_10o58lswtk().s[8]++, {
  PAGE_EDIT: "/page/edit"
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMTBvNThsc3d0ayIsImFjdHVhbENvdmVyYWdlIiwiV0VCU09DS0VUX0VWRU5UUyIsInMiLCJSRUNPTk5FQ1QiLCJESVNDT05ORUNURUQiLCJDT05ORUNURUQiLCJyZWNvbm5lY3RXZWJzb2NrZXRFdmVudCIsImYiLCJ0eXBlIiwid2Vic29ja2V0RGlzY29ubmVjdGVkRXZlbnQiLCJ3ZWJzb2NrZXRDb25uZWN0ZWRFdmVudCIsIlJUU19CQVNFX1BBVEgiLCJXRUJTT0NLRVRfTkFNRVNQQUNFIiwiUEFHRV9FRElUIl0sInNvdXJjZXMiOlsiV2Vic29ja2V0Q29uc3RhbnRzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgV0VCU09DS0VUX0VWRU5UUyA9IHtcbiAgUkVDT05ORUNUOiBcIlJFQ09OTkVDVFwiLFxuICBESVNDT05ORUNURUQ6IFwiRElTQ09OTkVDVEVEXCIsXG4gIENPTk5FQ1RFRDogXCJDT05ORUNURURcIixcbn07XG5cbmV4cG9ydCBjb25zdCByZWNvbm5lY3RXZWJzb2NrZXRFdmVudCA9ICgpID0+ICh7XG4gIHR5cGU6IFdFQlNPQ0tFVF9FVkVOVFMuUkVDT05ORUNULFxufSk7XG5cbmV4cG9ydCBjb25zdCB3ZWJzb2NrZXREaXNjb25uZWN0ZWRFdmVudCA9ICgpID0+ICh7XG4gIHR5cGU6IFdFQlNPQ0tFVF9FVkVOVFMuRElTQ09OTkVDVEVELFxufSk7XG5cbmV4cG9ydCBjb25zdCB3ZWJzb2NrZXRDb25uZWN0ZWRFdmVudCA9ICgpID0+ICh7XG4gIHR5cGU6IFdFQlNPQ0tFVF9FVkVOVFMuQ09OTkVDVEVELFxufSk7XG5cbmV4cG9ydCBjb25zdCBSVFNfQkFTRV9QQVRIID0gXCIvcnRzXCI7XG5leHBvcnQgY29uc3QgV0VCU09DS0VUX05BTUVTUEFDRSA9IHtcbiAgUEFHRV9FRElUOiBcIi9wYWdlL2VkaXRcIixcbn07XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLE9BQU8sTUFBTUUsZ0JBQWdCLElBQUFGLGNBQUEsR0FBQUcsQ0FBQSxPQUFHO0VBQzlCQyxTQUFTLEVBQUUsV0FBVztFQUN0QkMsWUFBWSxFQUFFLGNBQWM7RUFDNUJDLFNBQVMsRUFBRTtBQUNiLENBQUM7QUFBQ04sY0FBQSxHQUFBRyxDQUFBO0FBRUYsT0FBTyxNQUFNSSx1QkFBdUIsR0FBR0EsQ0FBQSxLQUFPO0VBQUFQLGNBQUEsR0FBQVEsQ0FBQTtFQUFBUixjQUFBLEdBQUFHLENBQUE7RUFBQTtJQUM1Q00sSUFBSSxFQUFFUCxnQkFBZ0IsQ0FBQ0U7RUFDekIsQ0FBQztBQUFELENBQUU7QUFBQ0osY0FBQSxHQUFBRyxDQUFBO0FBRUgsT0FBTyxNQUFNTywwQkFBMEIsR0FBR0EsQ0FBQSxLQUFPO0VBQUFWLGNBQUEsR0FBQVEsQ0FBQTtFQUFBUixjQUFBLEdBQUFHLENBQUE7RUFBQTtJQUMvQ00sSUFBSSxFQUFFUCxnQkFBZ0IsQ0FBQ0c7RUFDekIsQ0FBQztBQUFELENBQUU7QUFBQ0wsY0FBQSxHQUFBRyxDQUFBO0FBRUgsT0FBTyxNQUFNUSx1QkFBdUIsR0FBR0EsQ0FBQSxLQUFPO0VBQUFYLGNBQUEsR0FBQVEsQ0FBQTtFQUFBUixjQUFBLEdBQUFHLENBQUE7RUFBQTtJQUM1Q00sSUFBSSxFQUFFUCxnQkFBZ0IsQ0FBQ0k7RUFDekIsQ0FBQztBQUFELENBQUU7QUFFRixPQUFPLE1BQU1NLGFBQWEsSUFBQVosY0FBQSxHQUFBRyxDQUFBLE9BQUcsTUFBTTtBQUNuQyxPQUFPLE1BQU1VLG1CQUFtQixJQUFBYixjQUFBLEdBQUFHLENBQUEsT0FBRztFQUNqQ1csU0FBUyxFQUFFO0FBQ2IsQ0FBQyJ9