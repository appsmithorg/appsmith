import { createGlobalStyle } from "styled-components";
import { Classes } from "@blueprintjs/core";
import { Classes as PopoverClasses } from "@blueprintjs/popover2";
import { Layers } from "constants/Layers";

export const PopoverStyles = createGlobalStyle`
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
  .bp3-modal-widget.onboarding-carousel-portal {
    z-index: ${Layers.help} !important; 
  }

  .auth-type-dropdown .ads-dropdown-options-wrapper {
    padding: 0;
  }
`;
