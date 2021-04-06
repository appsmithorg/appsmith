import { createGlobalStyle } from "styled-components";
import { Classes } from "@blueprintjs/core";

export const PopoverStyles = createGlobalStyle`
  .${Classes.POPOVER} {
    box-shadow: 0px 0px 2px rgb(0 0 0 / 20%), 0px 2px 10px rgb(0 0 0 / 10%);
  }
`;
