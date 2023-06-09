function cov_2cwvdqmfvs() {
  var path = "/Users/apple/github/appsmith/app/client/src/globalStyles/dialogs.ts";
  var hash = "af615170c8a8a85830f53bf55737fdf817841fa4";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/globalStyles/dialogs.ts",
    statementMap: {
      "0": {
        start: {
          line: 5,
          column: 28
        },
        end: {
          line: 9,
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
    hash: "af615170c8a8a85830f53bf55737fdf817841fa4"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_2cwvdqmfvs = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_2cwvdqmfvs();
import { createGlobalStyle } from "styled-components";
import { Classes } from "@blueprintjs/core";
import { Classes as GitSyncClasses } from "pages/Editor/gitSync/constants";
export const DialogStyles = (cov_2cwvdqmfvs().s[0]++, createGlobalStyle`
  .${GitSyncClasses.GIT_SYNC_MODAL} .${Classes.DIALOG_BODY}.${Classes.DIALOG_BODY} {
    padding: 0;
  }
`);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMmN3dmRxbWZ2cyIsImFjdHVhbENvdmVyYWdlIiwiY3JlYXRlR2xvYmFsU3R5bGUiLCJDbGFzc2VzIiwiR2l0U3luY0NsYXNzZXMiLCJEaWFsb2dTdHlsZXMiLCJzIiwiR0lUX1NZTkNfTU9EQUwiLCJESUFMT0dfQk9EWSJdLCJzb3VyY2VzIjpbImRpYWxvZ3MudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlR2xvYmFsU3R5bGUgfSBmcm9tIFwic3R5bGVkLWNvbXBvbmVudHNcIjtcbmltcG9ydCB7IENsYXNzZXMgfSBmcm9tIFwiQGJsdWVwcmludGpzL2NvcmVcIjtcbmltcG9ydCB7IENsYXNzZXMgYXMgR2l0U3luY0NsYXNzZXMgfSBmcm9tIFwicGFnZXMvRWRpdG9yL2dpdFN5bmMvY29uc3RhbnRzXCI7XG5cbmV4cG9ydCBjb25zdCBEaWFsb2dTdHlsZXMgPSBjcmVhdGVHbG9iYWxTdHlsZWBcbiAgLiR7R2l0U3luY0NsYXNzZXMuR0lUX1NZTkNfTU9EQUx9IC4ke0NsYXNzZXMuRElBTE9HX0JPRFl9LiR7Q2xhc3Nlcy5ESUFMT0dfQk9EWX0ge1xuICAgIHBhZGRpbmc6IDA7XG4gIH1cbmA7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLFNBQVNFLGlCQUFpQixRQUFRLG1CQUFtQjtBQUNyRCxTQUFTQyxPQUFPLFFBQVEsbUJBQW1CO0FBQzNDLFNBQVNBLE9BQU8sSUFBSUMsY0FBYyxRQUFRLGdDQUFnQztBQUUxRSxPQUFPLE1BQU1DLFlBQVksSUFBQUwsY0FBQSxHQUFBTSxDQUFBLE9BQUdKLGlCQUFrQjtBQUM5QyxLQUFLRSxjQUFjLENBQUNHLGNBQWUsS0FBSUosT0FBTyxDQUFDSyxXQUFZLElBQUdMLE9BQU8sQ0FBQ0ssV0FBWTtBQUNsRjtBQUNBO0FBQ0EsQ0FBQyJ9