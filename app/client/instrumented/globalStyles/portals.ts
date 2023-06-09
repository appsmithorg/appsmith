function cov_14hg9xigyd() {
  var path = "/Users/apple/github/appsmith/app/client/src/globalStyles/portals.ts";
  var hash = "5902044f0ee793f92610885b119cb3c156daaa4f";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/globalStyles/portals.ts",
    statementMap: {
      "0": {
        start: {
          line: 8,
          column: 36
        },
        end: {
          line: 8,
          column: 52
        }
      },
      "1": {
        start: {
          line: 10,
          column: 28
        },
        end: {
          line: 60,
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
    hash: "5902044f0ee793f92610885b119cb3c156daaa4f"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_14hg9xigyd = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_14hg9xigyd();
import { createGlobalStyle } from "styled-components";
import { Layers } from "constants/Layers";
import { Classes } from "@blueprintjs/core";
import { Classes as GitSyncClasses } from "pages/Editor/gitSync/constants";
import { Classes as GuidedTourClasses } from "pages/Editor/GuidedTour/constants";
import { Colors } from "constants/Colors";
export const replayHighlightClass = (cov_14hg9xigyd().s[0]++, "ur--has-border");
export const PortalStyles = (cov_14hg9xigyd().s[1]++, createGlobalStyle`
  #header-root {
    position: relative;
    z-index: ${Layers.header};
  }


  .bp3-portal {
    z-index: ${Layers.portals};
  }

  .file-picker-dialog.bp3-dialog .${Classes.DIALOG_BODY} {
    padding: 0;
  }

  .${GitSyncClasses.MERGE_DROPDOWN} .ads-dropdown-options-wrapper {
    border: none;
  }
  .flash .${replayHighlightClass} {
    border-color: ${Colors.WARNING_SOLID} !important;
    box-shadow: 0px 0px 4px 0.5px rgba(254, 184, 17, 0.7) !important;

    & > input, .CodeMirror, .appsmith-select__control {
      border-color: ${Colors.WARNING_SOLID} !important;
      box-shadow: 0px 0px 4px 0.5px rgba(254, 184, 17, 0.7) !important;
    }
  }

  .${GuidedTourClasses.GUIDED_TOUR_BORDER} {
    position:fixed;
    border: 4px solid transparent;
    border-radius: var(--ads-v2-border-radius);
    filter: drop-shadow(0px 1px 3px rgba(16, 24, 40, 0.1)) drop-shadow(0px 1px 2px rgba(16, 24, 40, 0.06));
    transition: all 1s;
    z-index: 3;
    pointer-events: none;
  }

  .${GuidedTourClasses.GUIDED_TOUR_SHOW_BORDER} {
    border-color: var(--ads-v2-color-border-brand-emphasis-plus);
  }

  .${GuidedTourClasses.GUIDED_TOUR_INDICATOR} {
    position: fixed;
    z-index: 3;
    pointer-events: none;
    height: 50px;
    width: 90px;
    transition: all 1s;
  }
`);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMTRoZzl4aWd5ZCIsImFjdHVhbENvdmVyYWdlIiwiY3JlYXRlR2xvYmFsU3R5bGUiLCJMYXllcnMiLCJDbGFzc2VzIiwiR2l0U3luY0NsYXNzZXMiLCJHdWlkZWRUb3VyQ2xhc3NlcyIsIkNvbG9ycyIsInJlcGxheUhpZ2hsaWdodENsYXNzIiwicyIsIlBvcnRhbFN0eWxlcyIsImhlYWRlciIsInBvcnRhbHMiLCJESUFMT0dfQk9EWSIsIk1FUkdFX0RST1BET1dOIiwiV0FSTklOR19TT0xJRCIsIkdVSURFRF9UT1VSX0JPUkRFUiIsIkdVSURFRF9UT1VSX1NIT1dfQk9SREVSIiwiR1VJREVEX1RPVVJfSU5ESUNBVE9SIl0sInNvdXJjZXMiOlsicG9ydGFscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVHbG9iYWxTdHlsZSB9IGZyb20gXCJzdHlsZWQtY29tcG9uZW50c1wiO1xuaW1wb3J0IHsgTGF5ZXJzIH0gZnJvbSBcImNvbnN0YW50cy9MYXllcnNcIjtcbmltcG9ydCB7IENsYXNzZXMgfSBmcm9tIFwiQGJsdWVwcmludGpzL2NvcmVcIjtcbmltcG9ydCB7IENsYXNzZXMgYXMgR2l0U3luY0NsYXNzZXMgfSBmcm9tIFwicGFnZXMvRWRpdG9yL2dpdFN5bmMvY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBDbGFzc2VzIGFzIEd1aWRlZFRvdXJDbGFzc2VzIH0gZnJvbSBcInBhZ2VzL0VkaXRvci9HdWlkZWRUb3VyL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgQ29sb3JzIH0gZnJvbSBcImNvbnN0YW50cy9Db2xvcnNcIjtcblxuZXhwb3J0IGNvbnN0IHJlcGxheUhpZ2hsaWdodENsYXNzID0gXCJ1ci0taGFzLWJvcmRlclwiO1xuXG5leHBvcnQgY29uc3QgUG9ydGFsU3R5bGVzID0gY3JlYXRlR2xvYmFsU3R5bGVgXG4gICNoZWFkZXItcm9vdCB7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIHotaW5kZXg6ICR7TGF5ZXJzLmhlYWRlcn07XG4gIH1cblxuXG4gIC5icDMtcG9ydGFsIHtcbiAgICB6LWluZGV4OiAke0xheWVycy5wb3J0YWxzfTtcbiAgfVxuXG4gIC5maWxlLXBpY2tlci1kaWFsb2cuYnAzLWRpYWxvZyAuJHtDbGFzc2VzLkRJQUxPR19CT0RZfSB7XG4gICAgcGFkZGluZzogMDtcbiAgfVxuXG4gIC4ke0dpdFN5bmNDbGFzc2VzLk1FUkdFX0RST1BET1dOfSAuYWRzLWRyb3Bkb3duLW9wdGlvbnMtd3JhcHBlciB7XG4gICAgYm9yZGVyOiBub25lO1xuICB9XG4gIC5mbGFzaCAuJHtyZXBsYXlIaWdobGlnaHRDbGFzc30ge1xuICAgIGJvcmRlci1jb2xvcjogJHtDb2xvcnMuV0FSTklOR19TT0xJRH0gIWltcG9ydGFudDtcbiAgICBib3gtc2hhZG93OiAwcHggMHB4IDRweCAwLjVweCByZ2JhKDI1NCwgMTg0LCAxNywgMC43KSAhaW1wb3J0YW50O1xuXG4gICAgJiA+IGlucHV0LCAuQ29kZU1pcnJvciwgLmFwcHNtaXRoLXNlbGVjdF9fY29udHJvbCB7XG4gICAgICBib3JkZXItY29sb3I6ICR7Q29sb3JzLldBUk5JTkdfU09MSUR9ICFpbXBvcnRhbnQ7XG4gICAgICBib3gtc2hhZG93OiAwcHggMHB4IDRweCAwLjVweCByZ2JhKDI1NCwgMTg0LCAxNywgMC43KSAhaW1wb3J0YW50O1xuICAgIH1cbiAgfVxuXG4gIC4ke0d1aWRlZFRvdXJDbGFzc2VzLkdVSURFRF9UT1VSX0JPUkRFUn0ge1xuICAgIHBvc2l0aW9uOmZpeGVkO1xuICAgIGJvcmRlcjogNHB4IHNvbGlkIHRyYW5zcGFyZW50O1xuICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWFkcy12Mi1ib3JkZXItcmFkaXVzKTtcbiAgICBmaWx0ZXI6IGRyb3Atc2hhZG93KDBweCAxcHggM3B4IHJnYmEoMTYsIDI0LCA0MCwgMC4xKSkgZHJvcC1zaGFkb3coMHB4IDFweCAycHggcmdiYSgxNiwgMjQsIDQwLCAwLjA2KSk7XG4gICAgdHJhbnNpdGlvbjogYWxsIDFzO1xuICAgIHotaW5kZXg6IDM7XG4gICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gIH1cblxuICAuJHtHdWlkZWRUb3VyQ2xhc3Nlcy5HVUlERURfVE9VUl9TSE9XX0JPUkRFUn0ge1xuICAgIGJvcmRlci1jb2xvcjogdmFyKC0tYWRzLXYyLWNvbG9yLWJvcmRlci1icmFuZC1lbXBoYXNpcy1wbHVzKTtcbiAgfVxuXG4gIC4ke0d1aWRlZFRvdXJDbGFzc2VzLkdVSURFRF9UT1VSX0lORElDQVRPUn0ge1xuICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICB6LWluZGV4OiAzO1xuICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgIGhlaWdodDogNTBweDtcbiAgICB3aWR0aDogOTBweDtcbiAgICB0cmFuc2l0aW9uOiBhbGwgMXM7XG4gIH1cbmA7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFlWTtJQUFBQSxjQUFBLFlBQUFBLENBQUE7TUFBQSxPQUFBQyxjQUFBO0lBQUE7RUFBQTtFQUFBLE9BQUFBLGNBQUE7QUFBQTtBQUFBRCxjQUFBO0FBZlosU0FBU0UsaUJBQWlCLFFBQVEsbUJBQW1CO0FBQ3JELFNBQVNDLE1BQU0sUUFBUSxrQkFBa0I7QUFDekMsU0FBU0MsT0FBTyxRQUFRLG1CQUFtQjtBQUMzQyxTQUFTQSxPQUFPLElBQUlDLGNBQWMsUUFBUSxnQ0FBZ0M7QUFDMUUsU0FBU0QsT0FBTyxJQUFJRSxpQkFBaUIsUUFBUSxtQ0FBbUM7QUFDaEYsU0FBU0MsTUFBTSxRQUFRLGtCQUFrQjtBQUV6QyxPQUFPLE1BQU1DLG9CQUFvQixJQUFBUixjQUFBLEdBQUFTLENBQUEsT0FBRyxnQkFBZ0I7QUFFcEQsT0FBTyxNQUFNQyxZQUFZLElBQUFWLGNBQUEsR0FBQVMsQ0FBQSxPQUFHUCxpQkFBa0I7QUFDOUM7QUFDQTtBQUNBLGVBQWVDLE1BQU0sQ0FBQ1EsTUFBTztBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVBQWVSLE1BQU0sQ0FBQ1MsT0FBUTtBQUM5QjtBQUNBO0FBQ0Esb0NBQW9DUixPQUFPLENBQUNTLFdBQVk7QUFDeEQ7QUFDQTtBQUNBO0FBQ0EsS0FBS1IsY0FBYyxDQUFDUyxjQUFlO0FBQ25DO0FBQ0E7QUFDQSxZQUFZTixvQkFBcUI7QUFDakMsb0JBQW9CRCxNQUFNLENBQUNRLGFBQWM7QUFDekM7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCUixNQUFNLENBQUNRLGFBQWM7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLVCxpQkFBaUIsQ0FBQ1Usa0JBQW1CO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUtWLGlCQUFpQixDQUFDVyx1QkFBd0I7QUFDL0M7QUFDQTtBQUNBO0FBQ0EsS0FBS1gsaUJBQWlCLENBQUNZLHFCQUFzQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUMifQ==