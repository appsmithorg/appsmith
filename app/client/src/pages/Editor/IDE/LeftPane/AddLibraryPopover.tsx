import {
  Button,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from "design-system";
import React, { useState } from "react";
import {
  createMessage,
  customJSLibraryMessages,
} from "@appsmith/constants/messages";
import { Installer } from "../../Explorer/Libraries/Installer";

const AddLibraryPopover = () => {
  const [open, setOpen] = useState(false);
  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger>
        <Button
          isIconButton
          kind="tertiary"
          onClick={() => setOpen(true)}
          size="sm"
          startIcon="add-line"
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[25]" side="left" size="md">
        <PopoverHeader className="sticky top-0" isClosable>
          {createMessage(customJSLibraryMessages.ADD_JS_LIBRARY)}
        </PopoverHeader>
        <PopoverBody className={"!overflow-y-clip"}>
          <Installer />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default AddLibraryPopover;
