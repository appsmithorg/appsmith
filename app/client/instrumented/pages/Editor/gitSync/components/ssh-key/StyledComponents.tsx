function cov_p1hd3n257() {
  var path = "/Users/apple/github/appsmith/app/client/src/pages/Editor/gitSync/components/ssh-key/StyledComponents.tsx";
  var hash = "d2ab57792c956014fe4639fe343065580a589849";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/pages/Editor/gitSync/components/ssh-key/StyledComponents.tsx",
    statementMap: {
      "0": {
        start: {
          line: 3,
          column: 30
        },
        end: {
          line: 8,
          column: 1
        }
      },
      "1": {
        start: {
          line: 10,
          column: 36
        },
        end: {
          line: 20,
          column: 1
        }
      },
      "2": {
        start: {
          line: 11,
          column: 27
        },
        end: {
          line: 11,
          column: 70
        }
      },
      "3": {
        start: {
          line: 17,
          column: 4
        },
        end: {
          line: 17,
          column: 59
        }
      },
      "4": {
        start: {
          line: 22,
          column: 23
        },
        end: {
          line: 27,
          column: 1
        }
      },
      "5": {
        start: {
          line: 29,
          column: 35
        },
        end: {
          line: 32,
          column: 1
        }
      },
      "6": {
        start: {
          line: 34,
          column: 42
        },
        end: {
          line: 38,
          column: 1
        }
      },
      "7": {
        start: {
          line: 40,
          column: 23
        },
        end: {
          line: 45,
          column: 1
        }
      },
      "8": {
        start: {
          line: 47,
          column: 23
        },
        end: {
          line: 58,
          column: 1
        }
      },
      "9": {
        start: {
          line: 60,
          column: 31
        },
        end: {
          line: 63,
          column: 1
        }
      },
      "10": {
        start: {
          line: 65,
          column: 29
        },
        end: {
          line: 67,
          column: 1
        }
      },
      "11": {
        start: {
          line: 69,
          column: 43
        },
        end: {
          line: 71,
          column: 1
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 11,
            column: 16
          },
          end: {
            line: 11,
            column: 17
          }
        },
        loc: {
          start: {
            line: 11,
            column: 27
          },
          end: {
            line: 11,
            column: 70
          }
        },
        line: 11
      },
      "1": {
        name: "(anonymous_1)",
        decl: {
          start: {
            line: 16,
            column: 13
          },
          end: {
            line: 16,
            column: 14
          }
        },
        loc: {
          start: {
            line: 17,
            column: 4
          },
          end: {
            line: 17,
            column: 59
          }
        },
        line: 17
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
      "8": 0,
      "9": 0,
      "10": 0,
      "11": 0
    },
    f: {
      "0": 0,
      "1": 0
    },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "d2ab57792c956014fe4639fe343065580a589849"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_p1hd3n257 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_p1hd3n257();
import styled from "styled-components";
export const TooltipWrapper = (cov_p1hd3n257().s[0]++, styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: -3px;
`);
export const DeployedKeyContainer = (cov_p1hd3n257().s[1]++, styled.div < {
  $marginTop: number
} > `
  margin-top: ${props => {
  cov_p1hd3n257().f[0]++;
  cov_p1hd3n257().s[2]++;
  return `${props.theme.spaces[props.$marginTop]}px`;
}};
  margin-bottom: 8px;
  height: 35px;
  width: calc(100% - 39px);
  border: 1px solid var(--ads-v2-color-border);
  padding: ${props => {
  cov_p1hd3n257().f[1]++;
  cov_p1hd3n257().s[3]++;
  return `${props.theme.spaces[3]}px ${props.theme.spaces[4]}px`;
}};
  box-sizing: border-box;
  border-radius: var(--ads-v2-border-radius);
`);
export const FlexRow = (cov_p1hd3n257().s[4]++, styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 3px;
`);
export const ConfirmRegeneration = (cov_p1hd3n257().s[5]++, styled(FlexRow)`
  margin-top: 16.5px;
  justify-content: space-between;
`);
export const ConfirmRegenerationActions = (cov_p1hd3n257().s[6]++, styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 5px;
`);
export const KeyType = (cov_p1hd3n257().s[7]++, styled.span`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--ads-v2-color-fg);
`);
export const KeyText = (cov_p1hd3n257().s[8]++, styled.span`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  flex: 1;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--ads-v2-color-fg);
  direction: rtl;
  margin-right: 8px;
`);
export const MoreMenuWrapper = (cov_p1hd3n257().s[9]++, styled.div`
  align-items: center;
  margin-top: 3px;
`);
export const IconContainer = (cov_p1hd3n257().s[10]++, styled.div`
  margin-top: -3px;
`);
export const NotificationBannerContainer = (cov_p1hd3n257().s[11]++, styled.div`
  max-width: calc(100% - 39px);
`);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfcDFoZDNuMjU3IiwiYWN0dWFsQ292ZXJhZ2UiLCJzdHlsZWQiLCJUb29sdGlwV3JhcHBlciIsInMiLCJkaXYiLCJEZXBsb3llZEtleUNvbnRhaW5lciIsIiRtYXJnaW5Ub3AiLCJudW1iZXIiLCJwcm9wcyIsImYiLCJ0aGVtZSIsInNwYWNlcyIsIkZsZXhSb3ciLCJDb25maXJtUmVnZW5lcmF0aW9uIiwiQ29uZmlybVJlZ2VuZXJhdGlvbkFjdGlvbnMiLCJLZXlUeXBlIiwic3BhbiIsIktleVRleHQiLCJNb3JlTWVudVdyYXBwZXIiLCJJY29uQ29udGFpbmVyIiwiTm90aWZpY2F0aW9uQmFubmVyQ29udGFpbmVyIl0sInNvdXJjZXMiOlsiU3R5bGVkQ29tcG9uZW50cy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHN0eWxlZCBmcm9tIFwic3R5bGVkLWNvbXBvbmVudHNcIjtcblxuZXhwb3J0IGNvbnN0IFRvb2x0aXBXcmFwcGVyID0gc3R5bGVkLmRpdmBcbiAgZGlzcGxheTogZmxleDtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIG1hcmdpbi10b3A6IC0zcHg7XG5gO1xuXG5leHBvcnQgY29uc3QgRGVwbG95ZWRLZXlDb250YWluZXIgPSBzdHlsZWQuZGl2PHsgJG1hcmdpblRvcDogbnVtYmVyIH0+YFxuICBtYXJnaW4tdG9wOiAkeyhwcm9wcykgPT4gYCR7cHJvcHMudGhlbWUuc3BhY2VzW3Byb3BzLiRtYXJnaW5Ub3BdfXB4YH07XG4gIG1hcmdpbi1ib3R0b206IDhweDtcbiAgaGVpZ2h0OiAzNXB4O1xuICB3aWR0aDogY2FsYygxMDAlIC0gMzlweCk7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWFkcy12Mi1jb2xvci1ib3JkZXIpO1xuICBwYWRkaW5nOiAkeyhwcm9wcykgPT5cbiAgICBgJHtwcm9wcy50aGVtZS5zcGFjZXNbM119cHggJHtwcm9wcy50aGVtZS5zcGFjZXNbNF19cHhgfTtcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgYm9yZGVyLXJhZGl1czogdmFyKC0tYWRzLXYyLWJvcmRlci1yYWRpdXMpO1xuYDtcblxuZXhwb3J0IGNvbnN0IEZsZXhSb3cgPSBzdHlsZWQuZGl2YFxuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICB3aWR0aDogMTAwJTtcbiAgZ2FwOiAzcHg7XG5gO1xuXG5leHBvcnQgY29uc3QgQ29uZmlybVJlZ2VuZXJhdGlvbiA9IHN0eWxlZChGbGV4Um93KWBcbiAgbWFyZ2luLXRvcDogMTYuNXB4O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG5gO1xuXG5leHBvcnQgY29uc3QgQ29uZmlybVJlZ2VuZXJhdGlvbkFjdGlvbnMgPSBzdHlsZWQuZGl2YFxuICBkaXNwbGF5OiBmbGV4O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICBnYXA6IDVweDtcbmA7XG5cbmV4cG9ydCBjb25zdCBLZXlUeXBlID0gc3R5bGVkLnNwYW5gXG4gIGZvbnQtc2l6ZTogMTBweDtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgY29sb3I6IHZhcigtLWFkcy12Mi1jb2xvci1mZyk7XG5gO1xuXG5leHBvcnQgY29uc3QgS2V5VGV4dCA9IHN0eWxlZC5zcGFuYFxuICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgZmxleDogMTtcbiAgZm9udC1zaXplOiAxMHB4O1xuICBmb250LXdlaWdodDogNjAwO1xuICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuICBjb2xvcjogdmFyKC0tYWRzLXYyLWNvbG9yLWZnKTtcbiAgZGlyZWN0aW9uOiBydGw7XG4gIG1hcmdpbi1yaWdodDogOHB4O1xuYDtcblxuZXhwb3J0IGNvbnN0IE1vcmVNZW51V3JhcHBlciA9IHN0eWxlZC5kaXZgXG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIG1hcmdpbi10b3A6IDNweDtcbmA7XG5cbmV4cG9ydCBjb25zdCBJY29uQ29udGFpbmVyID0gc3R5bGVkLmRpdmBcbiAgbWFyZ2luLXRvcDogLTNweDtcbmA7XG5cbmV4cG9ydCBjb25zdCBOb3RpZmljYXRpb25CYW5uZXJDb250YWluZXIgPSBzdHlsZWQuZGl2YFxuICBtYXgtd2lkdGg6IGNhbGMoMTAwJSAtIDM5cHgpO1xuYDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGFBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGFBQUE7QUFmWixPQUFPRSxNQUFNLE1BQU0sbUJBQW1CO0FBRXRDLE9BQU8sTUFBTUMsY0FBYyxJQUFBSCxhQUFBLEdBQUFJLENBQUEsT0FBR0YsTUFBTSxDQUFDRyxHQUFJO0FBQ3pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUVELE9BQU8sTUFBTUMsb0JBQW9CLElBQUFOLGFBQUEsR0FBQUksQ0FBQSxPQUFHRixNQUFNLENBQUNHLEdBQUcsR0FBQztFQUFFRSxVQUFVLEVBQUVDO0FBQU8sQ0FBQyxHQUFFO0FBQ3ZFLGdCQUFpQkMsS0FBSyxJQUFLO0VBQUFULGFBQUEsR0FBQVUsQ0FBQTtFQUFBVixhQUFBLEdBQUFJLENBQUE7RUFBQSxPQUFDLEdBQUVLLEtBQUssQ0FBQ0UsS0FBSyxDQUFDQyxNQUFNLENBQUNILEtBQUssQ0FBQ0YsVUFBVSxDQUFFLElBQUc7QUFBRCxDQUFFO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBY0UsS0FBSyxJQUNmO0VBQUFULGFBQUEsR0FBQVUsQ0FBQTtFQUFBVixhQUFBLEdBQUFJLENBQUE7RUFBQSxPQUFDLEdBQUVLLEtBQUssQ0FBQ0UsS0FBSyxDQUFDQyxNQUFNLENBQUMsQ0FBQyxDQUFFLE1BQUtILEtBQUssQ0FBQ0UsS0FBSyxDQUFDQyxNQUFNLENBQUMsQ0FBQyxDQUFFLElBQUc7QUFBRCxDQUFFO0FBQzVEO0FBQ0E7QUFDQSxDQUFDO0FBRUQsT0FBTyxNQUFNQyxPQUFPLElBQUFiLGFBQUEsR0FBQUksQ0FBQSxPQUFHRixNQUFNLENBQUNHLEdBQUk7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBRUQsT0FBTyxNQUFNUyxtQkFBbUIsSUFBQWQsYUFBQSxHQUFBSSxDQUFBLE9BQUdGLE1BQU0sQ0FBQ1csT0FBTyxDQUFFO0FBQ25EO0FBQ0E7QUFDQSxDQUFDO0FBRUQsT0FBTyxNQUFNRSwwQkFBMEIsSUFBQWYsYUFBQSxHQUFBSSxDQUFBLE9BQUdGLE1BQU0sQ0FBQ0csR0FBSTtBQUNyRDtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBRUQsT0FBTyxNQUFNVyxPQUFPLElBQUFoQixhQUFBLEdBQUFJLENBQUEsT0FBR0YsTUFBTSxDQUFDZSxJQUFLO0FBQ25DO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUVELE9BQU8sTUFBTUMsT0FBTyxJQUFBbEIsYUFBQSxHQUFBSSxDQUFBLE9BQUdGLE1BQU0sQ0FBQ2UsSUFBSztBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFFRCxPQUFPLE1BQU1FLGVBQWUsSUFBQW5CLGFBQUEsR0FBQUksQ0FBQSxPQUFHRixNQUFNLENBQUNHLEdBQUk7QUFDMUM7QUFDQTtBQUNBLENBQUM7QUFFRCxPQUFPLE1BQU1lLGFBQWEsSUFBQXBCLGFBQUEsR0FBQUksQ0FBQSxRQUFHRixNQUFNLENBQUNHLEdBQUk7QUFDeEM7QUFDQSxDQUFDO0FBRUQsT0FBTyxNQUFNZ0IsMkJBQTJCLElBQUFyQixhQUFBLEdBQUFJLENBQUEsUUFBR0YsTUFBTSxDQUFDRyxHQUFJO0FBQ3REO0FBQ0EsQ0FBQyJ9