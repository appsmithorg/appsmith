import {
  Button,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from "design-system";
import React, { useState } from "react";

const CreateDatasourcePopover = () => {
  const [isOpen, setOpen] = useState(false);
  return (
    <Popover onOpenChange={setOpen} open={isOpen}>
      <PopoverTrigger>
        <Button
          kind="tertiary"
          onClick={() => setOpen(true)}
          startIcon="add-line"
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[25]" side="left" size="md">
        <PopoverHeader className="sticky top-0" isClosable>
          Datasources
        </PopoverHeader>
        <PopoverBody className={"!overflow-y-clip"} />
      </PopoverContent>
    </Popover>
  );
};

export default CreateDatasourcePopover;
