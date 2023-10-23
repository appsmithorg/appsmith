import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverTrigger,
} from "design-system";
import React from "react";

function DatasourceStarterLayoutPrompt() {
  return (
    <Popover
      onOpenChange={() => {
        return true;
      }}
      open
    >
      <PopoverTrigger>
        <div />
      </PopoverTrigger>

      <PopoverContent align="start" className="z-[25]" side="left" size="md">
        <PopoverHeader className="sticky top-0" isClosable>
          {"Bring your data in!"}
        </PopoverHeader>
        <PopoverBody className={"!overflow-y-clip"}>
          <p>test</p>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export default DatasourceStarterLayoutPrompt;
