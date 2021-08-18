import { createGlobalStyle } from "styled-components";
import { Classes } from "@blueprintjs/core";
import { Classes as GitSyncClasses } from "pages/Editor/gitSync/constants";

export const DialogStyles = createGlobalStyle`
  .${GitSyncClasses} .${Classes.DIALOG_BODY} {
    padding: 0 !important;
  }
`;
