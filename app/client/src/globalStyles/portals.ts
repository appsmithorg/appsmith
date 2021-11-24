import { createGlobalStyle } from "styled-components";
import { Layers } from "constants/Layers";
import { Classes } from "@blueprintjs/core";

export const PortalStyles = createGlobalStyle`
  #header-root {
    position: relative;
    z-index: ${Layers.header};
  }
  
  #tooltip-root {
    position: absolute;
    top: 0;
    width: 100%;
    z-index: ${Layers.max};
  }

  .bp3-portal {
    z-index: ${Layers.portals};
  }

  .file-picker-dialog.bp3-dialog .${Classes.DIALOG_BODY} {
    padding: 0;
  }

  .bp3-portal.inline-comment-thread {
    z-index: ${Layers.appComments};
  }

  .flash .ur--has-border {
    border-color: #FEB811 !important;
    box-shadow: 0px 0px 4px 0.5px rgba(254, 184, 17, 0.7) !important;

    & > input, .CodeMirror, .appsmith-select__control {
      border-color: #FEB811 !important;
      box-shadow: 0px 0px 4px 0.5px rgba(254, 184, 17, 0.7) !important;
    }
  }
`;
