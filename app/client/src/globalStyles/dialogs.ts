import { createGlobalStyle } from "styled-components";
import { Classes } from "@blueprintjs/core";

export const DialogStyles = createGlobalStyle`
  .git-sync-modal .${Classes.DIALOG_BODY} {
    padding: 0 !important;
  }
`;
