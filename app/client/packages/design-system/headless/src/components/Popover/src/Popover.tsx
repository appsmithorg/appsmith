import React from "react";
import { usePopover } from "./usePopover";
import { PopoverContext } from "./PopoverContext";

import type { PopoverProps } from "./types";

export const Popover = (props: PopoverProps) => {
  const { children, modal = false, ...rest } = props;
  const popover = usePopover({ modal, children, ...rest });

  return (
    <PopoverContext.Provider value={popover}>
      {children}
    </PopoverContext.Provider>
  );
};
