function cov_1f1uiey0kh() {
  var path = "/Users/apple/github/appsmith/app/client/src/components/editorComponents/CodeEditor/PeekOverlayPopup/JsonWrapper.tsx";
  var hash = "255d50c95b0829ec7912513bd5553f678bae5f10";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/components/editorComponents/CodeEditor/PeekOverlayPopup/JsonWrapper.tsx",
    statementMap: {
      "0": {
        start: {
          line: 3,
          column: 30
        },
        end: {
          line: 15,
          column: 1
        }
      },
      "1": {
        start: {
          line: 17,
          column: 27
        },
        end: {
          line: 91,
          column: 1
        }
      }
    },
    fnMap: {},
    branchMap: {},
    s: {
      "0": 0,
      "1": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "255d50c95b0829ec7912513bd5553f678bae5f10"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1f1uiey0kh = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1f1uiey0kh();
import styled from "styled-components";
export const reactJsonProps = (cov_1f1uiey0kh().s[0]++, {
  name: null,
  enableClipboard: false,
  displayDataTypes: false,
  displayArrayKey: true,
  quotesOnKeys: false,
  style: {
    fontSize: "10px"
  },
  collapsed: 1,
  indentWidth: 2,
  collapseStringsAfterLength: 30
});
export const JsonWrapper = (cov_1f1uiey0kh().s[1]++, styled.div`
  // all ellipsis font size
  .node-ellipsis,
  .function-collapsed span:nth-child(2),
  .string-value span {
    font-size: 10px !important;
  }

  // disable and hide first object collapser
  .pretty-json-container
    > .object-content:first-of-type
    > .object-key-val:first-of-type
    > span {
    pointer-events: none !important;
    .icon-container {
      display: none !important;
    }
  }

  // collapse icon color change and alignment
  .icon-container {
    width: 10px !important;
    height: 8px !important;
    svg {
      color: var(--appsmith-color-black-600) !important;
    }
  }

  // font-sizes and alignments
  .pushed-content.object-container {
    .object-content {
      padding-left: 4px !important;
      .variable-row {
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        border-left: 0 !important;
        .variable-value div {
          text-transform: lowercase;
          font-size: 10px !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }
      }
      .object-key-val {
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        padding-left: 0 !important;
        border-left: 0 !important;
      }
    }
  }

  // disabling function collapse and neutral styling
  .rjv-function-container {
    pointer-events: none;
    font-weight: normal !important;
    > span:first-child:before {
      // In prod build, for some reason react-json-viewer
      // misses adding this opening braces for function
      content: "(";
    }
    .function-collapsed {
      font-weight: normal !important;
      span:nth-child(1) {
        display: none; // hiding extra braces
      }
      span:nth-child(2) {
        color: #393939 !important;
      }
    }
  }
  div:has(.rjv-function-container) {
    cursor: default !important;
  }
`);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMWYxdWlleTBraCIsImFjdHVhbENvdmVyYWdlIiwic3R5bGVkIiwicmVhY3RKc29uUHJvcHMiLCJzIiwibmFtZSIsImVuYWJsZUNsaXBib2FyZCIsImRpc3BsYXlEYXRhVHlwZXMiLCJkaXNwbGF5QXJyYXlLZXkiLCJxdW90ZXNPbktleXMiLCJzdHlsZSIsImZvbnRTaXplIiwiY29sbGFwc2VkIiwiaW5kZW50V2lkdGgiLCJjb2xsYXBzZVN0cmluZ3NBZnRlckxlbmd0aCIsIkpzb25XcmFwcGVyIiwiZGl2Il0sInNvdXJjZXMiOlsiSnNvbldyYXBwZXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzdHlsZWQgZnJvbSBcInN0eWxlZC1jb21wb25lbnRzXCI7XG5cbmV4cG9ydCBjb25zdCByZWFjdEpzb25Qcm9wcyA9IHtcbiAgbmFtZTogbnVsbCxcbiAgZW5hYmxlQ2xpcGJvYXJkOiBmYWxzZSxcbiAgZGlzcGxheURhdGFUeXBlczogZmFsc2UsXG4gIGRpc3BsYXlBcnJheUtleTogdHJ1ZSxcbiAgcXVvdGVzT25LZXlzOiBmYWxzZSxcbiAgc3R5bGU6IHtcbiAgICBmb250U2l6ZTogXCIxMHB4XCIsXG4gIH0sXG4gIGNvbGxhcHNlZDogMSxcbiAgaW5kZW50V2lkdGg6IDIsXG4gIGNvbGxhcHNlU3RyaW5nc0FmdGVyTGVuZ3RoOiAzMCxcbn07XG5cbmV4cG9ydCBjb25zdCBKc29uV3JhcHBlciA9IHN0eWxlZC5kaXZgXG4gIC8vIGFsbCBlbGxpcHNpcyBmb250IHNpemVcbiAgLm5vZGUtZWxsaXBzaXMsXG4gIC5mdW5jdGlvbi1jb2xsYXBzZWQgc3BhbjpudGgtY2hpbGQoMiksXG4gIC5zdHJpbmctdmFsdWUgc3BhbiB7XG4gICAgZm9udC1zaXplOiAxMHB4ICFpbXBvcnRhbnQ7XG4gIH1cblxuICAvLyBkaXNhYmxlIGFuZCBoaWRlIGZpcnN0IG9iamVjdCBjb2xsYXBzZXJcbiAgLnByZXR0eS1qc29uLWNvbnRhaW5lclxuICAgID4gLm9iamVjdC1jb250ZW50OmZpcnN0LW9mLXR5cGVcbiAgICA+IC5vYmplY3Qta2V5LXZhbDpmaXJzdC1vZi10eXBlXG4gICAgPiBzcGFuIHtcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZSAhaW1wb3J0YW50O1xuICAgIC5pY29uLWNvbnRhaW5lciB7XG4gICAgICBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7XG4gICAgfVxuICB9XG5cbiAgLy8gY29sbGFwc2UgaWNvbiBjb2xvciBjaGFuZ2UgYW5kIGFsaWdubWVudFxuICAuaWNvbi1jb250YWluZXIge1xuICAgIHdpZHRoOiAxMHB4ICFpbXBvcnRhbnQ7XG4gICAgaGVpZ2h0OiA4cHggIWltcG9ydGFudDtcbiAgICBzdmcge1xuICAgICAgY29sb3I6IHZhcigtLWFwcHNtaXRoLWNvbG9yLWJsYWNrLTYwMCkgIWltcG9ydGFudDtcbiAgICB9XG4gIH1cblxuICAvLyBmb250LXNpemVzIGFuZCBhbGlnbm1lbnRzXG4gIC5wdXNoZWQtY29udGVudC5vYmplY3QtY29udGFpbmVyIHtcbiAgICAub2JqZWN0LWNvbnRlbnQge1xuICAgICAgcGFkZGluZy1sZWZ0OiA0cHggIWltcG9ydGFudDtcbiAgICAgIC52YXJpYWJsZS1yb3cge1xuICAgICAgICBwYWRkaW5nLXRvcDogMCAhaW1wb3J0YW50O1xuICAgICAgICBwYWRkaW5nLWJvdHRvbTogMCAhaW1wb3J0YW50O1xuICAgICAgICBib3JkZXItbGVmdDogMCAhaW1wb3J0YW50O1xuICAgICAgICAudmFyaWFibGUtdmFsdWUgZGl2IHtcbiAgICAgICAgICB0ZXh0LXRyYW5zZm9ybTogbG93ZXJjYXNlO1xuICAgICAgICAgIGZvbnQtc2l6ZTogMTBweCAhaW1wb3J0YW50O1xuICAgICAgICAgIHBhZGRpbmctdG9wOiAwICFpbXBvcnRhbnQ7XG4gICAgICAgICAgcGFkZGluZy1ib3R0b206IDAgIWltcG9ydGFudDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLm9iamVjdC1rZXktdmFsIHtcbiAgICAgICAgcGFkZGluZy10b3A6IDAgIWltcG9ydGFudDtcbiAgICAgICAgcGFkZGluZy1ib3R0b206IDAgIWltcG9ydGFudDtcbiAgICAgICAgcGFkZGluZy1sZWZ0OiAwICFpbXBvcnRhbnQ7XG4gICAgICAgIGJvcmRlci1sZWZ0OiAwICFpbXBvcnRhbnQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gZGlzYWJsaW5nIGZ1bmN0aW9uIGNvbGxhcHNlIGFuZCBuZXV0cmFsIHN0eWxpbmdcbiAgLnJqdi1mdW5jdGlvbi1jb250YWluZXIge1xuICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgIGZvbnQtd2VpZ2h0OiBub3JtYWwgIWltcG9ydGFudDtcbiAgICA+IHNwYW46Zmlyc3QtY2hpbGQ6YmVmb3JlIHtcbiAgICAgIC8vIEluIHByb2QgYnVpbGQsIGZvciBzb21lIHJlYXNvbiByZWFjdC1qc29uLXZpZXdlclxuICAgICAgLy8gbWlzc2VzIGFkZGluZyB0aGlzIG9wZW5pbmcgYnJhY2VzIGZvciBmdW5jdGlvblxuICAgICAgY29udGVudDogXCIoXCI7XG4gICAgfVxuICAgIC5mdW5jdGlvbi1jb2xsYXBzZWQge1xuICAgICAgZm9udC13ZWlnaHQ6IG5vcm1hbCAhaW1wb3J0YW50O1xuICAgICAgc3BhbjpudGgtY2hpbGQoMSkge1xuICAgICAgICBkaXNwbGF5OiBub25lOyAvLyBoaWRpbmcgZXh0cmEgYnJhY2VzXG4gICAgICB9XG4gICAgICBzcGFuOm50aC1jaGlsZCgyKSB7XG4gICAgICAgIGNvbG9yOiAjMzkzOTM5ICFpbXBvcnRhbnQ7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGRpdjpoYXMoLnJqdi1mdW5jdGlvbi1jb250YWluZXIpIHtcbiAgICBjdXJzb3I6IGRlZmF1bHQgIWltcG9ydGFudDtcbiAgfVxuYDtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixPQUFPRSxNQUFNLE1BQU0sbUJBQW1CO0FBRXRDLE9BQU8sTUFBTUMsY0FBYyxJQUFBSCxjQUFBLEdBQUFJLENBQUEsT0FBRztFQUM1QkMsSUFBSSxFQUFFLElBQUk7RUFDVkMsZUFBZSxFQUFFLEtBQUs7RUFDdEJDLGdCQUFnQixFQUFFLEtBQUs7RUFDdkJDLGVBQWUsRUFBRSxJQUFJO0VBQ3JCQyxZQUFZLEVBQUUsS0FBSztFQUNuQkMsS0FBSyxFQUFFO0lBQ0xDLFFBQVEsRUFBRTtFQUNaLENBQUM7RUFDREMsU0FBUyxFQUFFLENBQUM7RUFDWkMsV0FBVyxFQUFFLENBQUM7RUFDZEMsMEJBQTBCLEVBQUU7QUFDOUIsQ0FBQztBQUVELE9BQU8sTUFBTUMsV0FBVyxJQUFBZixjQUFBLEdBQUFJLENBQUEsT0FBR0YsTUFBTSxDQUFDYyxHQUFJO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyJ9