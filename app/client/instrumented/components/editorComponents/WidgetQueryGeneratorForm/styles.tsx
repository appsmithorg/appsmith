function cov_j7antf59l() {
  var path = "/Users/apple/github/appsmith/app/client/src/components/editorComponents/WidgetQueryGeneratorForm/styles.tsx";
  var hash = "391a1f6032cbfc7902ed7768d32e76a81e7cb192";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/components/editorComponents/WidgetQueryGeneratorForm/styles.tsx",
    statementMap: {
      "0": {
        start: {
          line: 6,
          column: 23
        },
        end: {
          line: 6,
          column: 35
        }
      },
      "1": {
        start: {
          line: 8,
          column: 29
        },
        end: {
          line: 13,
          column: 1
        }
      },
      "2": {
        start: {
          line: 15,
          column: 21
        },
        end: {
          line: 18,
          column: 1
        }
      },
      "3": {
        start: {
          line: 20,
          column: 20
        },
        end: {
          line: 22,
          column: 1
        }
      },
      "4": {
        start: {
          line: 24,
          column: 23
        },
        end: {
          line: 24,
          column: 35
        }
      },
      "5": {
        start: {
          line: 26,
          column: 19
        },
        end: {
          line: 30,
          column: 1
        }
      },
      "6": {
        start: {
          line: 32,
          column: 30
        },
        end: {
          line: 34,
          column: 1
        }
      },
      "7": {
        start: {
          line: 36,
          column: 26
        },
        end: {
          line: 38,
          column: 1
        }
      },
      "8": {
        start: {
          line: 40,
          column: 28
        },
        end: {
          line: 44,
          column: 1
        }
      },
      "9": {
        start: {
          line: 46,
          column: 33
        },
        end: {
          line: 49,
          column: 1
        }
      },
      "10": {
        start: {
          line: 51,
          column: 28
        },
        end: {
          line: 57,
          column: 1
        }
      },
      "11": {
        start: {
          line: 59,
          column: 31
        },
        end: {
          line: 62,
          column: 1
        }
      },
      "12": {
        start: {
          line: 64,
          column: 28
        },
        end: {
          line: 83,
          column: 1
        }
      },
      "13": {
        start: {
          line: 85,
          column: 23
        },
        end: {
          line: 93,
          column: 1
        }
      },
      "14": {
        start: {
          line: 95,
          column: 28
        },
        end: {
          line: 100,
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
      "4": 0,
      "5": 0,
      "6": 0,
      "7": 0,
      "8": 0,
      "9": 0,
      "10": 0,
      "11": 0,
      "12": 0,
      "13": 0,
      "14": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "391a1f6032cbfc7902ed7768d32e76a81e7cb192"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_j7antf59l = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_j7antf59l();
import { Colors } from "constants/Colors";
import { Button } from "design-system";
import styled, { createGlobalStyle } from "styled-components";
import { DROPDOWN_TRIGGER_DIMENSION } from "./constants";
export const Wrapper = (cov_j7antf59l().s[0]++, styled.div``);
export const SelectWrapper = (cov_j7antf59l().s[1]++, styled.div`
  display: inline-block;
  margin: 5px 0 2px;
  max-width: ${DROPDOWN_TRIGGER_DIMENSION.WIDTH};
  width: 100%;
`);
export const Label = (cov_j7antf59l().s[2]++, styled.p`
  flex: 1;
  white-space: nowrap;
`);
export const Bold = (cov_j7antf59l().s[3]++, styled.span`
  font-weight: 500;
`);
export const Section = (cov_j7antf59l().s[4]++, styled.div``);
export const Row = (cov_j7antf59l().s[5]++, styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`);
export const TooltipWrapper = (cov_j7antf59l().s[6]++, styled.div`
  margin-top: 2px;
`);
export const RowHeading = (cov_j7antf59l().s[7]++, styled.p`
  margin-right: 10px;
`);
export const StyledButton = (cov_j7antf59l().s[8]++, styled(Button)`
  &&& {
    width: 100%;
  }
`);
export const CreateIconWrapper = (cov_j7antf59l().s[9]++, styled.div`
  margin: 0px 8px 0px 0px;
  cursor: pointer;
`);
export const ImageWrapper = (cov_j7antf59l().s[10]++, styled.div`
  height: 20px;
  width: auto;
  display: flex;
  align-items: center;
  margin: 0px 8px 0px 0px;
`);
export const DatasourceImage = (cov_j7antf59l().s[11]++, styled.img`
  height: 16px;
  width: auto;
`);
export const GlobalStyles = (cov_j7antf59l().s[12]++, createGlobalStyle`
  .one-click-binding-datasource-dropdown {
    height: 300px;

    .rc-select-item-option-disabled {
      opacity: 1 !important;
    }

    .rc-virtual-list-holder {
      max-height: 290px !important;
    }

    .has-seperator {
      border-top: 1px solid ${Colors.GREY_4};
      border-radius: 0;
      margin-top: 10px;
      padding-top: 15px;
    }
  }
`);
export const Binding = (cov_j7antf59l().s[13]++, styled.div`
  display: flex;
  font-size: 12px;
  font-weight: 700;
  position: relative;
  left: 1px;
  top: -1px;
  color: var(--ads-v2-color-fg);
`);
export const ErrorMessage = (cov_j7antf59l().s[14]++, styled.div`
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: var(--ads-v2-color-fg-error);
`);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfajdhbnRmNTlsIiwiYWN0dWFsQ292ZXJhZ2UiLCJDb2xvcnMiLCJCdXR0b24iLCJzdHlsZWQiLCJjcmVhdGVHbG9iYWxTdHlsZSIsIkRST1BET1dOX1RSSUdHRVJfRElNRU5TSU9OIiwiV3JhcHBlciIsInMiLCJkaXYiLCJTZWxlY3RXcmFwcGVyIiwiV0lEVEgiLCJMYWJlbCIsInAiLCJCb2xkIiwic3BhbiIsIlNlY3Rpb24iLCJSb3ciLCJUb29sdGlwV3JhcHBlciIsIlJvd0hlYWRpbmciLCJTdHlsZWRCdXR0b24iLCJDcmVhdGVJY29uV3JhcHBlciIsIkltYWdlV3JhcHBlciIsIkRhdGFzb3VyY2VJbWFnZSIsImltZyIsIkdsb2JhbFN0eWxlcyIsIkdSRVlfNCIsIkJpbmRpbmciLCJFcnJvck1lc3NhZ2UiXSwic291cmNlcyI6WyJzdHlsZXMudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbG9ycyB9IGZyb20gXCJjb25zdGFudHMvQ29sb3JzXCI7XG5pbXBvcnQgeyBCdXR0b24gfSBmcm9tIFwiZGVzaWduLXN5c3RlbVwiO1xuaW1wb3J0IHN0eWxlZCwgeyBjcmVhdGVHbG9iYWxTdHlsZSB9IGZyb20gXCJzdHlsZWQtY29tcG9uZW50c1wiO1xuaW1wb3J0IHsgRFJPUERPV05fVFJJR0dFUl9ESU1FTlNJT04gfSBmcm9tIFwiLi9jb25zdGFudHNcIjtcblxuZXhwb3J0IGNvbnN0IFdyYXBwZXIgPSBzdHlsZWQuZGl2YGA7XG5cbmV4cG9ydCBjb25zdCBTZWxlY3RXcmFwcGVyID0gc3R5bGVkLmRpdmBcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICBtYXJnaW46IDVweCAwIDJweDtcbiAgbWF4LXdpZHRoOiAke0RST1BET1dOX1RSSUdHRVJfRElNRU5TSU9OLldJRFRIfTtcbiAgd2lkdGg6IDEwMCU7XG5gO1xuXG5leHBvcnQgY29uc3QgTGFiZWwgPSBzdHlsZWQucGBcbiAgZmxleDogMTtcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbmA7XG5cbmV4cG9ydCBjb25zdCBCb2xkID0gc3R5bGVkLnNwYW5gXG4gIGZvbnQtd2VpZ2h0OiA1MDA7XG5gO1xuXG5leHBvcnQgY29uc3QgU2VjdGlvbiA9IHN0eWxlZC5kaXZgYDtcblxuZXhwb3J0IGNvbnN0IFJvdyA9IHN0eWxlZC5kaXZgXG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDtcbmA7XG5cbmV4cG9ydCBjb25zdCBUb29sdGlwV3JhcHBlciA9IHN0eWxlZC5kaXZgXG4gIG1hcmdpbi10b3A6IDJweDtcbmA7XG5cbmV4cG9ydCBjb25zdCBSb3dIZWFkaW5nID0gc3R5bGVkLnBgXG4gIG1hcmdpbi1yaWdodDogMTBweDtcbmA7XG5cbmV4cG9ydCBjb25zdCBTdHlsZWRCdXR0b24gPSBzdHlsZWQoQnV0dG9uKWBcbiAgJiYmIHtcbiAgICB3aWR0aDogMTAwJTtcbiAgfVxuYDtcblxuZXhwb3J0IGNvbnN0IENyZWF0ZUljb25XcmFwcGVyID0gc3R5bGVkLmRpdmBcbiAgbWFyZ2luOiAwcHggOHB4IDBweCAwcHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbmA7XG5cbmV4cG9ydCBjb25zdCBJbWFnZVdyYXBwZXIgPSBzdHlsZWQuZGl2YFxuICBoZWlnaHQ6IDIwcHg7XG4gIHdpZHRoOiBhdXRvO1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBtYXJnaW46IDBweCA4cHggMHB4IDBweDtcbmA7XG5cbmV4cG9ydCBjb25zdCBEYXRhc291cmNlSW1hZ2UgPSBzdHlsZWQuaW1nYFxuICBoZWlnaHQ6IDE2cHg7XG4gIHdpZHRoOiBhdXRvO1xuYDtcblxuZXhwb3J0IGNvbnN0IEdsb2JhbFN0eWxlcyA9IGNyZWF0ZUdsb2JhbFN0eWxlYFxuICAub25lLWNsaWNrLWJpbmRpbmctZGF0YXNvdXJjZS1kcm9wZG93biB7XG4gICAgaGVpZ2h0OiAzMDBweDtcblxuICAgIC5yYy1zZWxlY3QtaXRlbS1vcHRpb24tZGlzYWJsZWQge1xuICAgICAgb3BhY2l0eTogMSAhaW1wb3J0YW50O1xuICAgIH1cblxuICAgIC5yYy12aXJ0dWFsLWxpc3QtaG9sZGVyIHtcbiAgICAgIG1heC1oZWlnaHQ6IDI5MHB4ICFpbXBvcnRhbnQ7XG4gICAgfVxuXG4gICAgLmhhcy1zZXBlcmF0b3Ige1xuICAgICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkICR7Q29sb3JzLkdSRVlfNH07XG4gICAgICBib3JkZXItcmFkaXVzOiAwO1xuICAgICAgbWFyZ2luLXRvcDogMTBweDtcbiAgICAgIHBhZGRpbmctdG9wOiAxNXB4O1xuICAgIH1cbiAgfVxuYDtcblxuZXhwb3J0IGNvbnN0IEJpbmRpbmcgPSBzdHlsZWQuZGl2YFxuICBkaXNwbGF5OiBmbGV4O1xuICBmb250LXNpemU6IDEycHg7XG4gIGZvbnQtd2VpZ2h0OiA3MDA7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgbGVmdDogMXB4O1xuICB0b3A6IC0xcHg7XG4gIGNvbG9yOiB2YXIoLS1hZHMtdjItY29sb3ItZmcpO1xuYDtcblxuZXhwb3J0IGNvbnN0IEVycm9yTWVzc2FnZSA9IHN0eWxlZC5kaXZgXG4gIGZvbnQtd2VpZ2h0OiA0MDA7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgbGluZS1oZWlnaHQ6IDE0cHg7XG4gIGNvbG9yOiB2YXIoLS1hZHMtdjItY29sb3ItZmctZXJyb3IpO1xuYDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsYUFBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFB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