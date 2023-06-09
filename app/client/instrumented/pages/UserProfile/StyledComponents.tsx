function cov_ijpsppuwv() {
  var path = "/Users/apple/github/appsmith/app/client/src/pages/UserProfile/StyledComponents.tsx";
  var hash = "06cbe0994ab10252f9b8142e9d925f1341920ff1";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/pages/UserProfile/StyledComponents.tsx",
    statementMap: {
      "0": {
        start: {
          line: 3,
          column: 23
        },
        end: {
          line: 9,
          column: 1
        }
      },
      "1": {
        start: {
          line: 10,
          column: 28
        },
        end: {
          line: 17,
          column: 1
        }
      },
      "2": {
        start: {
          line: 19,
          column: 28
        },
        end: {
          line: 27,
          column: 1
        }
      },
      "3": {
        start: {
          line: 29,
          column: 22
        },
        end: {
          line: 33,
          column: 1
        }
      },
      "4": {
        start: {
          line: 35,
          column: 26
        },
        end: {
          line: 39,
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
    hash: "06cbe0994ab10252f9b8142e9d925f1341920ff1"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_ijpsppuwv = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_ijpsppuwv();
import styled from "styled-components";
export const Wrapper = (cov_ijpsppuwv().s[0]++, styled.div`
  width: 320px;
  /* margin: 0 auto; */
  & > div {
    margin-bottom: 16px;
  }
`);
export const FieldWrapper = (cov_ijpsppuwv().s[1]++, styled.div`
  /* width: 460px; */
  /* display: flex; */
  .user-profile-image-picker {
    width: 166px;
    margin-top: 4px;
  }
`);
export const LabelWrapper = (cov_ijpsppuwv().s[2]++, styled.div`
  .self-center {
    align-self: center;
  }
  /* width: 240px; */
  /* display: flex; */
  color: var(--ads-v2-color-fg);
  /* font-size: 14px; */
`);
export const Loader = (cov_ijpsppuwv().s[3]++, styled.div`
  height: 38px;
  width: 320px;
  border-radius: 0;
`);
export const TextLoader = (cov_ijpsppuwv().s[4]++, styled.div`
  height: 15px;
  width: 320px;
  border-radius: 0;
`);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfaWpwc3BwdXd2IiwiYWN0dWFsQ292ZXJhZ2UiLCJzdHlsZWQiLCJXcmFwcGVyIiwicyIsImRpdiIsIkZpZWxkV3JhcHBlciIsIkxhYmVsV3JhcHBlciIsIkxvYWRlciIsIlRleHRMb2FkZXIiXSwic291cmNlcyI6WyJTdHlsZWRDb21wb25lbnRzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgc3R5bGVkIGZyb20gXCJzdHlsZWQtY29tcG9uZW50c1wiO1xuXG5leHBvcnQgY29uc3QgV3JhcHBlciA9IHN0eWxlZC5kaXZgXG4gIHdpZHRoOiAzMjBweDtcbiAgLyogbWFyZ2luOiAwIGF1dG87ICovXG4gICYgPiBkaXYge1xuICAgIG1hcmdpbi1ib3R0b206IDE2cHg7XG4gIH1cbmA7XG5leHBvcnQgY29uc3QgRmllbGRXcmFwcGVyID0gc3R5bGVkLmRpdmBcbiAgLyogd2lkdGg6IDQ2MHB4OyAqL1xuICAvKiBkaXNwbGF5OiBmbGV4OyAqL1xuICAudXNlci1wcm9maWxlLWltYWdlLXBpY2tlciB7XG4gICAgd2lkdGg6IDE2NnB4O1xuICAgIG1hcmdpbi10b3A6IDRweDtcbiAgfVxuYDtcblxuZXhwb3J0IGNvbnN0IExhYmVsV3JhcHBlciA9IHN0eWxlZC5kaXZgXG4gIC5zZWxmLWNlbnRlciB7XG4gICAgYWxpZ24tc2VsZjogY2VudGVyO1xuICB9XG4gIC8qIHdpZHRoOiAyNDBweDsgKi9cbiAgLyogZGlzcGxheTogZmxleDsgKi9cbiAgY29sb3I6IHZhcigtLWFkcy12Mi1jb2xvci1mZyk7XG4gIC8qIGZvbnQtc2l6ZTogMTRweDsgKi9cbmA7XG5cbmV4cG9ydCBjb25zdCBMb2FkZXIgPSBzdHlsZWQuZGl2YFxuICBoZWlnaHQ6IDM4cHg7XG4gIHdpZHRoOiAzMjBweDtcbiAgYm9yZGVyLXJhZGl1czogMDtcbmA7XG5cbmV4cG9ydCBjb25zdCBUZXh0TG9hZGVyID0gc3R5bGVkLmRpdmBcbiAgaGVpZ2h0OiAxNXB4O1xuICB3aWR0aDogMzIwcHg7XG4gIGJvcmRlci1yYWRpdXM6IDA7XG5gO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsYUFBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsYUFBQTtBQWZaLE9BQU9FLE1BQU0sTUFBTSxtQkFBbUI7QUFFdEMsT0FBTyxNQUFNQyxPQUFPLElBQUFILGFBQUEsR0FBQUksQ0FBQSxPQUFHRixNQUFNLENBQUNHLEdBQUk7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPQUFPLE1BQU1DLFlBQVksSUFBQU4sYUFBQSxHQUFBSSxDQUFBLE9BQUdGLE1BQU0sQ0FBQ0csR0FBSTtBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBRUQsT0FBTyxNQUFNRSxZQUFZLElBQUFQLGFBQUEsR0FBQUksQ0FBQSxPQUFHRixNQUFNLENBQUNHLEdBQUk7QUFDdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBRUQsT0FBTyxNQUFNRyxNQUFNLElBQUFSLGFBQUEsR0FBQUksQ0FBQSxPQUFHRixNQUFNLENBQUNHLEdBQUk7QUFDakM7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUVELE9BQU8sTUFBTUksVUFBVSxJQUFBVCxhQUFBLEdBQUFJLENBQUEsT0FBR0YsTUFBTSxDQUFDRyxHQUFJO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBLENBQUMifQ==