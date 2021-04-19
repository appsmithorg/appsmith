import { Classes } from "@blueprintjs/core";
import { createGlobalStyle } from "styled-components";

export const CommentThreadPopoverStyles = createGlobalStyle`
  .comment-thread .${Classes.POPOVER_CONTENT} {
    border-radius: 0px;
  }

  .comment-context-menu {
    z-index: 13;
  }
`;
