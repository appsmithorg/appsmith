import { createGlobalStyle } from "styled-components";
import { Layers } from "constants/Layers";
import { Classes } from "@blueprintjs/core";
import { Classes as GitSyncClasses } from "pages/Editor/gitSync/constants";
import { Colors } from "constants/Colors";
import { GuidedTourClasses } from "components/utils/Indicator";

export const replayHighlightClass = "ur--has-border";

export const PortalStyles = createGlobalStyle`
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
    z-index: ${Layers.guidedTour};
    pointer-events: none;
  }

  .${GuidedTourClasses.GUIDED_TOUR_SHOW_BORDER} {
    border-color: var(--ads-v2-color-border-brand-emphasis-plus);
  }

  .${GuidedTourClasses.GUIDED_TOUR_INDICATOR} {
    position: fixed;
    z-index: ${Layers.guidedTour};
    pointer-events: none;
    height: 50px;
    width: 90px;
    transition: all 1s;
  }
`;
