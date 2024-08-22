import React from "react";

import { PopoverContext } from "./PopoverContext";
import type { PopoverProps } from "./types";
import { usePopover } from "./usePopover";

export const Popover = (props: PopoverProps) => {
  const { children, modal = false, ...rest } = props;
  const popover = usePopover({ modal, children, ...rest });

  return (
    <PopoverContext.Provider value={popover}>
      {children}
    </PopoverContext.Provider>
  );
};
