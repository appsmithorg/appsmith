import { Button, Popover, PopoverTrigger } from "design-system";
import React, { useState } from "react";

const AddLibraryPopover = () => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open}>
      <PopoverTrigger>
        <Button
          isIconButton
          kind="tertiary"
          onClick={() => setOpen(true)}
          size="sm"
          startIcon="add-line"
        />
      </PopoverTrigger>
    </Popover>
  );
};

export default AddLibraryPopover;
