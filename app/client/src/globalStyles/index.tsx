import React from "react";
import { TooltipStyles } from "./tooltip";
import { PopoverStyles } from "./popover";

export default function GlobalStyles() {
  return (
    <React.Fragment>
      <TooltipStyles />
      <PopoverStyles />
    </React.Fragment>
  );
}
