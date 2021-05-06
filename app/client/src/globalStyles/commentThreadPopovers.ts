import { Classes } from "@blueprintjs/core";
import { createGlobalStyle } from "styled-components";
import { Layers } from "constants/Layers";

export const CommentThreadPopoverStyles = createGlobalStyle`
  .comment-thread .${Classes.POPOVER_CONTENT} {
    border-radius: 0px;
  }

  .comment-context-menu {
    z-index: ${Layers.max};
  }

  .emoji-picker-portal {
    z-index: ${Layers.max};
  }

  .inline-comment-thread {
    // unable to reference headerHeight here
    margin-top: 35px;
  }
`;
