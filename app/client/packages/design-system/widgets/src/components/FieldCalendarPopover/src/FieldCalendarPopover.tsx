import React from "react";
import { Dialog } from "react-aria-components";
import { Popover, Calendar } from "@appsmith/wds";

export function FieldCalenderPopover() {
  const root = document.body.querySelector(
    "[data-theme-provider]",
  ) as HTMLButtonElement;

  return (
    <Popover UNSTABLE_portalContainer={root}>
      <Dialog>
        <Calendar />
      </Dialog>
    </Popover>
  );
}
