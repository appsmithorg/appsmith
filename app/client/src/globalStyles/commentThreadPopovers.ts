import { createGlobalStyle } from "styled-components";
import { Layers } from "constants/Layers";

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
`;
