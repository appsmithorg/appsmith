function cov_1sihrn38ul() {
  var path = "/Users/apple/github/appsmith/app/client/src/globalStyles/popover.ts";
  var hash = "cac2b1c918a4004b6c029722a552ec965c3f0ce3";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/globalStyles/popover.ts",
    statementMap: {
      "0": {
        start: {
          line: 7,
          column: 29
        },
        end: {
          line: 48,
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
    hash: "cac2b1c918a4004b6c029722a552ec965c3f0ce3"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1sihrn38ul = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1sihrn38ul();
import { createGlobalStyle } from "styled-components";
import { Classes } from "@blueprintjs/core";
import { Classes as PopoverClasses } from "@blueprintjs/popover2";
import { Layers } from "constants/Layers";
import { Colors } from "constants/Colors";
export const PopoverStyles = (cov_1sihrn38ul().s[0]++, createGlobalStyle`
  .${Classes.POPOVER}, .${PopoverClasses.POPOVER2} {
    box-shadow: 0px 0px 2px rgb(0 0 0 / 20%), 0px 2px 10px rgb(0 0 0 / 10%);
  }
  .${Classes.POPOVER},
  .${PopoverClasses.POPOVER2},
  .${PopoverClasses.POPOVER2} .${PopoverClasses.POPOVER2_CONTENT},
  .${Classes.POPOVER} .${Classes.POPOVER_CONTENT} {
    border-radius: 0px;
  }
  .bp3-datepicker {
    .DayPicker {
      min-height: 251px !important ;
      min-width: 233px !important ;
    }
  }
  .onboarding-carousel .${Classes.OVERLAY_CONTENT} {
    filter: drop-shadow(0px 6px 20px rgba(0, 0, 0, 0.15));
  }
  .templates-notification .bp3-popover2-arrow {
    // !important because top is specified as an inline style in the lib
    top: -8px !important;
  }
  .templates-notification .bp3-popover2-arrow-fill {
    fill: ${Colors.SEA_SHELL};
  }
  .bp3-modal-widget.onboarding-carousel-portal {
    z-index: ${Layers.help} !important; 
  }

  .auth-type-dropdown .ads-dropdown-options-wrapper {
    padding: 0;
  }
  .manual-upgrades {
    z-index: 10 !important;
    .manual-upgrades-overlay {
      .bp3-overlay-backdrop {
        opacity: 0.3;
      }
    }
  }
`);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMXNpaHJuMzh1bCIsImFjdHVhbENvdmVyYWdlIiwiY3JlYXRlR2xvYmFsU3R5bGUiLCJDbGFzc2VzIiwiUG9wb3ZlckNsYXNzZXMiLCJMYXllcnMiLCJDb2xvcnMiLCJQb3BvdmVyU3R5bGVzIiwicyIsIlBPUE9WRVIiLCJQT1BPVkVSMiIsIlBPUE9WRVIyX0NPTlRFTlQiLCJQT1BPVkVSX0NPTlRFTlQiLCJPVkVSTEFZX0NPTlRFTlQiLCJTRUFfU0hFTEwiLCJoZWxwIl0sInNvdXJjZXMiOlsicG9wb3Zlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVHbG9iYWxTdHlsZSB9IGZyb20gXCJzdHlsZWQtY29tcG9uZW50c1wiO1xuaW1wb3J0IHsgQ2xhc3NlcyB9IGZyb20gXCJAYmx1ZXByaW50anMvY29yZVwiO1xuaW1wb3J0IHsgQ2xhc3NlcyBhcyBQb3BvdmVyQ2xhc3NlcyB9IGZyb20gXCJAYmx1ZXByaW50anMvcG9wb3ZlcjJcIjtcbmltcG9ydCB7IExheWVycyB9IGZyb20gXCJjb25zdGFudHMvTGF5ZXJzXCI7XG5pbXBvcnQgeyBDb2xvcnMgfSBmcm9tIFwiY29uc3RhbnRzL0NvbG9yc1wiO1xuXG5leHBvcnQgY29uc3QgUG9wb3ZlclN0eWxlcyA9IGNyZWF0ZUdsb2JhbFN0eWxlYFxuICAuJHtDbGFzc2VzLlBPUE9WRVJ9LCAuJHtQb3BvdmVyQ2xhc3Nlcy5QT1BPVkVSMn0ge1xuICAgIGJveC1zaGFkb3c6IDBweCAwcHggMnB4IHJnYigwIDAgMCAvIDIwJSksIDBweCAycHggMTBweCByZ2IoMCAwIDAgLyAxMCUpO1xuICB9XG4gIC4ke0NsYXNzZXMuUE9QT1ZFUn0sXG4gIC4ke1BvcG92ZXJDbGFzc2VzLlBPUE9WRVIyfSxcbiAgLiR7UG9wb3ZlckNsYXNzZXMuUE9QT1ZFUjJ9IC4ke1BvcG92ZXJDbGFzc2VzLlBPUE9WRVIyX0NPTlRFTlR9LFxuICAuJHtDbGFzc2VzLlBPUE9WRVJ9IC4ke0NsYXNzZXMuUE9QT1ZFUl9DT05URU5UfSB7XG4gICAgYm9yZGVyLXJhZGl1czogMHB4O1xuICB9XG4gIC5icDMtZGF0ZXBpY2tlciB7XG4gICAgLkRheVBpY2tlciB7XG4gICAgICBtaW4taGVpZ2h0OiAyNTFweCAhaW1wb3J0YW50IDtcbiAgICAgIG1pbi13aWR0aDogMjMzcHggIWltcG9ydGFudCA7XG4gICAgfVxuICB9XG4gIC5vbmJvYXJkaW5nLWNhcm91c2VsIC4ke0NsYXNzZXMuT1ZFUkxBWV9DT05URU5UfSB7XG4gICAgZmlsdGVyOiBkcm9wLXNoYWRvdygwcHggNnB4IDIwcHggcmdiYSgwLCAwLCAwLCAwLjE1KSk7XG4gIH1cbiAgLnRlbXBsYXRlcy1ub3RpZmljYXRpb24gLmJwMy1wb3BvdmVyMi1hcnJvdyB7XG4gICAgLy8gIWltcG9ydGFudCBiZWNhdXNlIHRvcCBpcyBzcGVjaWZpZWQgYXMgYW4gaW5saW5lIHN0eWxlIGluIHRoZSBsaWJcbiAgICB0b3A6IC04cHggIWltcG9ydGFudDtcbiAgfVxuICAudGVtcGxhdGVzLW5vdGlmaWNhdGlvbiAuYnAzLXBvcG92ZXIyLWFycm93LWZpbGwge1xuICAgIGZpbGw6ICR7Q29sb3JzLlNFQV9TSEVMTH07XG4gIH1cbiAgLmJwMy1tb2RhbC13aWRnZXQub25ib2FyZGluZy1jYXJvdXNlbC1wb3J0YWwge1xuICAgIHotaW5kZXg6ICR7TGF5ZXJzLmhlbHB9ICFpbXBvcnRhbnQ7IFxuICB9XG5cbiAgLmF1dGgtdHlwZS1kcm9wZG93biAuYWRzLWRyb3Bkb3duLW9wdGlvbnMtd3JhcHBlciB7XG4gICAgcGFkZGluZzogMDtcbiAgfVxuICAubWFudWFsLXVwZ3JhZGVzIHtcbiAgICB6LWluZGV4OiAxMCAhaW1wb3J0YW50O1xuICAgIC5tYW51YWwtdXBncmFkZXMtb3ZlcmxheSB7XG4gICAgICAuYnAzLW92ZXJsYXktYmFja2Ryb3Age1xuICAgICAgICBvcGFjaXR5OiAwLjM7XG4gICAgICB9XG4gICAgfVxuICB9XG5gO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWixTQUFTRSxpQkFBaUIsUUFBUSxtQkFBbUI7QUFDckQsU0FBU0MsT0FBTyxRQUFRLG1CQUFtQjtBQUMzQyxTQUFTQSxPQUFPLElBQUlDLGNBQWMsUUFBUSx1QkFBdUI7QUFDakUsU0FBU0MsTUFBTSxRQUFRLGtCQUFrQjtBQUN6QyxTQUFTQyxNQUFNLFFBQVEsa0JBQWtCO0FBRXpDLE9BQU8sTUFBTUMsYUFBYSxJQUFBUCxjQUFBLEdBQUFRLENBQUEsT0FBR04saUJBQWtCO0FBQy9DLEtBQUtDLE9BQU8sQ0FBQ00sT0FBUSxNQUFLTCxjQUFjLENBQUNNLFFBQVM7QUFDbEQ7QUFDQTtBQUNBLEtBQUtQLE9BQU8sQ0FBQ00sT0FBUTtBQUNyQixLQUFLTCxjQUFjLENBQUNNLFFBQVM7QUFDN0IsS0FBS04sY0FBYyxDQUFDTSxRQUFTLEtBQUlOLGNBQWMsQ0FBQ08sZ0JBQWlCO0FBQ2pFLEtBQUtSLE9BQU8sQ0FBQ00sT0FBUSxLQUFJTixPQUFPLENBQUNTLGVBQWdCO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEJULE9BQU8sQ0FBQ1UsZUFBZ0I7QUFDbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZUCxNQUFNLENBQUNRLFNBQVU7QUFDN0I7QUFDQTtBQUNBLGVBQWVULE1BQU0sQ0FBQ1UsSUFBSztBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUMifQ==