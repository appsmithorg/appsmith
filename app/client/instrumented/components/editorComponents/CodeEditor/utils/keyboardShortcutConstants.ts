function cov_25hiy1soyf() {
  var path = "/Users/apple/github/appsmith/app/client/src/components/editorComponents/CodeEditor/utils/keyboardShortcutConstants.ts";
  var hash = "f55e095f7837ffb8db04b0c5ef0a2e8cbd530467";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/components/editorComponents/CodeEditor/utils/keyboardShortcutConstants.ts",
    statementMap: {
      "0": {
        start: {
          line: 3,
          column: 46
        },
        end: {
          line: 46,
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
    hash: "f55e095f7837ffb8db04b0c5ef0a2e8cbd530467"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_25hiy1soyf = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_25hiy1soyf();
import { PLATFORM_OS } from "../../../../utils/helpers";
export const KEYBOARD_SHORTCUTS_BY_PLATFORM = (cov_25hiy1soyf().s[0]++, {
  [PLATFORM_OS.MAC]: {
    saveAndAutoIndent: "Cmd-S",
    cursorLeftMovement: "Cmd-Left",
    autoIndentShortcut: "Shift-Cmd-P",
    autoIndentShortcutText: "Shift + Cmd + P",
    codeComment: "Cmd-/"
  },
  [PLATFORM_OS.IOS]: {
    saveAndAutoIndent: "Cmd-S",
    cursorLeftMovement: "Cmd-Left",
    autoIndentShortcut: "Shift-Cmd-P",
    autoIndentShortcutText: "Shift + Cmd + P",
    codeComment: "Cmd-/"
  },
  [PLATFORM_OS.WINDOWS]: {
    saveAndAutoIndent: "Ctrl-S",
    cursorLeftMovement: "Home",
    autoIndentShortcut: "Shift-Alt-F",
    autoIndentShortcutText: "Shift + Alt + F",
    codeComment: "Ctrl-/"
  },
  [PLATFORM_OS.ANDROID]: {
    saveAndAutoIndent: "Ctrl-S",
    cursorLeftMovement: "Home",
    autoIndentShortcut: "Shift-Alt-F",
    autoIndentShortcutText: "Shift + Alt + F",
    codeComment: "Ctrl-/"
  },
  [PLATFORM_OS.LINUX]: {
    saveAndAutoIndent: "Ctrl-S",
    cursorLeftMovement: "Home",
    autoIndentShortcut: "Shift-Ctrl-I",
    autoIndentShortcutText: "Shift + Ctrl + I",
    codeComment: "Ctrl-/"
  },
  default: {
    saveAndAutoIndent: "Ctrl-S",
    cursorLeftMovement: "Home",
    autoIndentShortcut: "Shift-Alt-F",
    autoIndentShortcutText: "Shift + Alt + F",
    codeComment: "Ctrl-/"
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMjVoaXkxc295ZiIsImFjdHVhbENvdmVyYWdlIiwiUExBVEZPUk1fT1MiLCJLRVlCT0FSRF9TSE9SVENVVFNfQllfUExBVEZPUk0iLCJzIiwiTUFDIiwic2F2ZUFuZEF1dG9JbmRlbnQiLCJjdXJzb3JMZWZ0TW92ZW1lbnQiLCJhdXRvSW5kZW50U2hvcnRjdXQiLCJhdXRvSW5kZW50U2hvcnRjdXRUZXh0IiwiY29kZUNvbW1lbnQiLCJJT1MiLCJXSU5ET1dTIiwiQU5EUk9JRCIsIkxJTlVYIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbImtleWJvYXJkU2hvcnRjdXRDb25zdGFudHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUExBVEZPUk1fT1MgfSBmcm9tIFwiLi4vLi4vLi4vLi4vdXRpbHMvaGVscGVyc1wiO1xuXG5leHBvcnQgY29uc3QgS0VZQk9BUkRfU0hPUlRDVVRTX0JZX1BMQVRGT1JNID0ge1xuICBbUExBVEZPUk1fT1MuTUFDXToge1xuICAgIHNhdmVBbmRBdXRvSW5kZW50OiBcIkNtZC1TXCIsXG4gICAgY3Vyc29yTGVmdE1vdmVtZW50OiBcIkNtZC1MZWZ0XCIsXG4gICAgYXV0b0luZGVudFNob3J0Y3V0OiBcIlNoaWZ0LUNtZC1QXCIsXG4gICAgYXV0b0luZGVudFNob3J0Y3V0VGV4dDogXCJTaGlmdCArIENtZCArIFBcIixcbiAgICBjb2RlQ29tbWVudDogXCJDbWQtL1wiLFxuICB9LFxuICBbUExBVEZPUk1fT1MuSU9TXToge1xuICAgIHNhdmVBbmRBdXRvSW5kZW50OiBcIkNtZC1TXCIsXG4gICAgY3Vyc29yTGVmdE1vdmVtZW50OiBcIkNtZC1MZWZ0XCIsXG4gICAgYXV0b0luZGVudFNob3J0Y3V0OiBcIlNoaWZ0LUNtZC1QXCIsXG4gICAgYXV0b0luZGVudFNob3J0Y3V0VGV4dDogXCJTaGlmdCArIENtZCArIFBcIixcbiAgICBjb2RlQ29tbWVudDogXCJDbWQtL1wiLFxuICB9LFxuICBbUExBVEZPUk1fT1MuV0lORE9XU106IHtcbiAgICBzYXZlQW5kQXV0b0luZGVudDogXCJDdHJsLVNcIixcbiAgICBjdXJzb3JMZWZ0TW92ZW1lbnQ6IFwiSG9tZVwiLFxuICAgIGF1dG9JbmRlbnRTaG9ydGN1dDogXCJTaGlmdC1BbHQtRlwiLFxuICAgIGF1dG9JbmRlbnRTaG9ydGN1dFRleHQ6IFwiU2hpZnQgKyBBbHQgKyBGXCIsXG4gICAgY29kZUNvbW1lbnQ6IFwiQ3RybC0vXCIsXG4gIH0sXG4gIFtQTEFURk9STV9PUy5BTkRST0lEXToge1xuICAgIHNhdmVBbmRBdXRvSW5kZW50OiBcIkN0cmwtU1wiLFxuICAgIGN1cnNvckxlZnRNb3ZlbWVudDogXCJIb21lXCIsXG4gICAgYXV0b0luZGVudFNob3J0Y3V0OiBcIlNoaWZ0LUFsdC1GXCIsXG4gICAgYXV0b0luZGVudFNob3J0Y3V0VGV4dDogXCJTaGlmdCArIEFsdCArIEZcIixcbiAgICBjb2RlQ29tbWVudDogXCJDdHJsLS9cIixcbiAgfSxcbiAgW1BMQVRGT1JNX09TLkxJTlVYXToge1xuICAgIHNhdmVBbmRBdXRvSW5kZW50OiBcIkN0cmwtU1wiLFxuICAgIGN1cnNvckxlZnRNb3ZlbWVudDogXCJIb21lXCIsXG4gICAgYXV0b0luZGVudFNob3J0Y3V0OiBcIlNoaWZ0LUN0cmwtSVwiLFxuICAgIGF1dG9JbmRlbnRTaG9ydGN1dFRleHQ6IFwiU2hpZnQgKyBDdHJsICsgSVwiLFxuICAgIGNvZGVDb21tZW50OiBcIkN0cmwtL1wiLFxuICB9LFxuICBkZWZhdWx0OiB7XG4gICAgc2F2ZUFuZEF1dG9JbmRlbnQ6IFwiQ3RybC1TXCIsXG4gICAgY3Vyc29yTGVmdE1vdmVtZW50OiBcIkhvbWVcIixcbiAgICBhdXRvSW5kZW50U2hvcnRjdXQ6IFwiU2hpZnQtQWx0LUZcIixcbiAgICBhdXRvSW5kZW50U2hvcnRjdXRUZXh0OiBcIlNoaWZ0ICsgQWx0ICsgRlwiLFxuICAgIGNvZGVDb21tZW50OiBcIkN0cmwtL1wiLFxuICB9LFxufTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosU0FBU0UsV0FBVyxRQUFRLDJCQUEyQjtBQUV2RCxPQUFPLE1BQU1DLDhCQUE4QixJQUFBSCxjQUFBLEdBQUFJLENBQUEsT0FBRztFQUM1QyxDQUFDRixXQUFXLENBQUNHLEdBQUcsR0FBRztJQUNqQkMsaUJBQWlCLEVBQUUsT0FBTztJQUMxQkMsa0JBQWtCLEVBQUUsVUFBVTtJQUM5QkMsa0JBQWtCLEVBQUUsYUFBYTtJQUNqQ0Msc0JBQXNCLEVBQUUsaUJBQWlCO0lBQ3pDQyxXQUFXLEVBQUU7RUFDZixDQUFDO0VBQ0QsQ0FBQ1IsV0FBVyxDQUFDUyxHQUFHLEdBQUc7SUFDakJMLGlCQUFpQixFQUFFLE9BQU87SUFDMUJDLGtCQUFrQixFQUFFLFVBQVU7SUFDOUJDLGtCQUFrQixFQUFFLGFBQWE7SUFDakNDLHNCQUFzQixFQUFFLGlCQUFpQjtJQUN6Q0MsV0FBVyxFQUFFO0VBQ2YsQ0FBQztFQUNELENBQUNSLFdBQVcsQ0FBQ1UsT0FBTyxHQUFHO0lBQ3JCTixpQkFBaUIsRUFBRSxRQUFRO0lBQzNCQyxrQkFBa0IsRUFBRSxNQUFNO0lBQzFCQyxrQkFBa0IsRUFBRSxhQUFhO0lBQ2pDQyxzQkFBc0IsRUFBRSxpQkFBaUI7SUFDekNDLFdBQVcsRUFBRTtFQUNmLENBQUM7RUFDRCxDQUFDUixXQUFXLENBQUNXLE9BQU8sR0FBRztJQUNyQlAsaUJBQWlCLEVBQUUsUUFBUTtJQUMzQkMsa0JBQWtCLEVBQUUsTUFBTTtJQUMxQkMsa0JBQWtCLEVBQUUsYUFBYTtJQUNqQ0Msc0JBQXNCLEVBQUUsaUJBQWlCO0lBQ3pDQyxXQUFXLEVBQUU7RUFDZixDQUFDO0VBQ0QsQ0FBQ1IsV0FBVyxDQUFDWSxLQUFLLEdBQUc7SUFDbkJSLGlCQUFpQixFQUFFLFFBQVE7SUFDM0JDLGtCQUFrQixFQUFFLE1BQU07SUFDMUJDLGtCQUFrQixFQUFFLGNBQWM7SUFDbENDLHNCQUFzQixFQUFFLGtCQUFrQjtJQUMxQ0MsV0FBVyxFQUFFO0VBQ2YsQ0FBQztFQUNESyxPQUFPLEVBQUU7SUFDUFQsaUJBQWlCLEVBQUUsUUFBUTtJQUMzQkMsa0JBQWtCLEVBQUUsTUFBTTtJQUMxQkMsa0JBQWtCLEVBQUUsYUFBYTtJQUNqQ0Msc0JBQXNCLEVBQUUsaUJBQWlCO0lBQ3pDQyxXQUFXLEVBQUU7RUFDZjtBQUNGLENBQUMifQ==