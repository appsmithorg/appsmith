import React from "react";
import { TooltipStyles } from "./tooltip";
import { AutocompleteStyles } from "./autocomplete";

export default function GlobalStyles() {
  return (
    <React.Fragment>
      <TooltipStyles />
      <AutocompleteStyles />
    </React.Fragment>
  );
}
