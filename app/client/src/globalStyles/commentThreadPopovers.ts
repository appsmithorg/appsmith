import { createGlobalStyle } from "styled-components";
import { Layers } from "constants/Layers";
import { Classes } from "@blueprintjs/core";

export const CommentThreadPopoverStyles = createGlobalStyle`
  .bp3-portal.comment-context-menu {
    z-index: ${Layers.max};
  }

  .bp3-portal.emoji-picker-portal {
    z-index: ${Layers.max};
  }

  .inline-comment-thread {
    /* unable to reference headerHeight here */
    margin-top: 35px;
  }

  .comments-onboarding-carousel .${Classes.OVERLAY_CONTENT} {
    box-shadow: 0px 0px 2px rgb(0 0 0 / 20%), 0px 2px 10px rgb(0 0 0 / 10%);
  }
`;
