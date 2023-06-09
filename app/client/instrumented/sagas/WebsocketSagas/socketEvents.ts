function cov_1urkh6juy0() {
  var path = "/Users/apple/github/appsmith/app/client/src/sagas/WebsocketSagas/socketEvents.ts";
  var hash = "bd1157945d88e259e2d6728cda2088a5c80dba9f";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/sagas/WebsocketSagas/socketEvents.ts",
    statementMap: {
      "0": {
        start: {
          line: 1,
          column: 40
        },
        end: {
          line: 4,
          column: 1
        }
      },
      "1": {
        start: {
          line: 6,
          column: 39
        },
        end: {
          line: 15,
          column: 1
        }
      },
      "2": {
        start: {
          line: 17,
          column: 40
        },
        end: {
          line: 22,
          column: 1
        }
      }
    },
    fnMap: {},
    branchMap: {},
    s: {
      "0": 0,
      "1": 0,
      "2": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "bd1157945d88e259e2d6728cda2088a5c80dba9f"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1urkh6juy0 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1urkh6juy0();
export const SOCKET_CONNECTION_EVENTS = (cov_1urkh6juy0().s[0]++, {
  CONNECT: "connect",
  DISCONNECT: "disconnect"
});
export const APP_LEVEL_SOCKET_EVENTS = (cov_1urkh6juy0().s[1]++, {
  // notification events
  INSERT_NOTIFICATION: "insert:notification",
  LIST_ONLINE_APP_EDITORS: "collab:online_editors",
  // user presence

  RELEASE_VERSION_NOTIFICATION: "info:release_version",
  // release version

  PAGE_VISIBILITY: "info:page_visibility" // is the page/tab visible to the user
});

export const PAGE_LEVEL_SOCKET_EVENTS = (cov_1urkh6juy0().s[2]++, {
  START_EDITING_APP: "collab:start_edit",
  STOP_EDITING_APP: "collab:leave_edit",
  LIST_ONLINE_PAGE_EDITORS: "collab:online_editors",
  SHARE_USER_POINTER: "collab:mouse_pointer" // multi pointer
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXVya2g2anV5MCIsImFjdHVhbENvdmVyYWdlIiwiU09DS0VUX0NPTk5FQ1RJT05fRVZFTlRTIiwicyIsIkNPTk5FQ1QiLCJESVNDT05ORUNUIiwiQVBQX0xFVkVMX1NPQ0tFVF9FVkVOVFMiLCJJTlNFUlRfTk9USUZJQ0FUSU9OIiwiTElTVF9PTkxJTkVfQVBQX0VESVRPUlMiLCJSRUxFQVNFX1ZFUlNJT05fTk9USUZJQ0FUSU9OIiwiUEFHRV9WSVNJQklMSVRZIiwiUEFHRV9MRVZFTF9TT0NLRVRfRVZFTlRTIiwiU1RBUlRfRURJVElOR19BUFAiLCJTVE9QX0VESVRJTkdfQVBQIiwiTElTVF9PTkxJTkVfUEFHRV9FRElUT1JTIiwiU0hBUkVfVVNFUl9QT0lOVEVSIl0sInNvdXJjZXMiOlsic29ja2V0RXZlbnRzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBTT0NLRVRfQ09OTkVDVElPTl9FVkVOVFMgPSB7XG4gIENPTk5FQ1Q6IFwiY29ubmVjdFwiLFxuICBESVNDT05ORUNUOiBcImRpc2Nvbm5lY3RcIixcbn07XG5cbmV4cG9ydCBjb25zdCBBUFBfTEVWRUxfU09DS0VUX0VWRU5UUyA9IHtcbiAgLy8gbm90aWZpY2F0aW9uIGV2ZW50c1xuICBJTlNFUlRfTk9USUZJQ0FUSU9OOiBcImluc2VydDpub3RpZmljYXRpb25cIixcblxuICBMSVNUX09OTElORV9BUFBfRURJVE9SUzogXCJjb2xsYWI6b25saW5lX2VkaXRvcnNcIiwgLy8gdXNlciBwcmVzZW5jZVxuXG4gIFJFTEVBU0VfVkVSU0lPTl9OT1RJRklDQVRJT046IFwiaW5mbzpyZWxlYXNlX3ZlcnNpb25cIiwgLy8gcmVsZWFzZSB2ZXJzaW9uXG5cbiAgUEFHRV9WSVNJQklMSVRZOiBcImluZm86cGFnZV92aXNpYmlsaXR5XCIsIC8vIGlzIHRoZSBwYWdlL3RhYiB2aXNpYmxlIHRvIHRoZSB1c2VyXG59O1xuXG5leHBvcnQgY29uc3QgUEFHRV9MRVZFTF9TT0NLRVRfRVZFTlRTID0ge1xuICBTVEFSVF9FRElUSU5HX0FQUDogXCJjb2xsYWI6c3RhcnRfZWRpdFwiLFxuICBTVE9QX0VESVRJTkdfQVBQOiBcImNvbGxhYjpsZWF2ZV9lZGl0XCIsXG4gIExJU1RfT05MSU5FX1BBR0VfRURJVE9SUzogXCJjb2xsYWI6b25saW5lX2VkaXRvcnNcIixcbiAgU0hBUkVfVVNFUl9QT0lOVEVSOiBcImNvbGxhYjptb3VzZV9wb2ludGVyXCIsIC8vIG11bHRpIHBvaW50ZXJcbn07XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixPQUFPLE1BQU1FLHdCQUF3QixJQUFBRixjQUFBLEdBQUFHLENBQUEsT0FBRztFQUN0Q0MsT0FBTyxFQUFFLFNBQVM7RUFDbEJDLFVBQVUsRUFBRTtBQUNkLENBQUM7QUFFRCxPQUFPLE1BQU1DLHVCQUF1QixJQUFBTixjQUFBLEdBQUFHLENBQUEsT0FBRztFQUNyQztFQUNBSSxtQkFBbUIsRUFBRSxxQkFBcUI7RUFFMUNDLHVCQUF1QixFQUFFLHVCQUF1QjtFQUFFOztFQUVsREMsNEJBQTRCLEVBQUUsc0JBQXNCO0VBQUU7O0VBRXREQyxlQUFlLEVBQUUsc0JBQXNCLENBQUU7QUFDM0MsQ0FBQzs7QUFFRCxPQUFPLE1BQU1DLHdCQUF3QixJQUFBWCxjQUFBLEdBQUFHLENBQUEsT0FBRztFQUN0Q1MsaUJBQWlCLEVBQUUsbUJBQW1CO0VBQ3RDQyxnQkFBZ0IsRUFBRSxtQkFBbUI7RUFDckNDLHdCQUF3QixFQUFFLHVCQUF1QjtFQUNqREMsa0JBQWtCLEVBQUUsc0JBQXNCLENBQUU7QUFDOUMsQ0FBQyJ9