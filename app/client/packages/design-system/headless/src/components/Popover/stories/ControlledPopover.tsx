import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@appsmith/wds-headless";
import { Button } from "react-aria-components";

export const ControlledPopover = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover isOpen={isOpen} setOpen={setIsOpen}>
      <PopoverTrigger>
        <Button onPress={() => setIsOpen(!isOpen)}>Controlled popover</Button>
      </PopoverTrigger>
      <PopoverContent>Controlled popover content</PopoverContent>
    </Popover>
  );
};
