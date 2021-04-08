import React from "react";
import { TooltipStyles } from "./tooltip";
import { PopoverStyles } from "./popover";
import { CommentThreadPopoverStyles } from "./commentThreadPopovers";

export default function GlobalStyles() {
  return (
    <React.Fragment>
      <TooltipStyles />
      <PopoverStyles />
      <CommentThreadPopoverStyles />
    </React.Fragment>
  );
}
