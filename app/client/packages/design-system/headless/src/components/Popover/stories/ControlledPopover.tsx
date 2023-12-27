import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
} from "@design-system/headless";

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
