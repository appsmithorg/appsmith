import {
  Button,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  type ButtonKind,
} from "@appsmith/ads";
import React, { useCallback, useState } from "react";
import { createMessage, customJSLibraryMessages } from "ee/constants/messages";
import { Installer } from "../../Explorer/Libraries/Installer";
import { clearInstalls } from "actions/JSLibraryActions";
import { useDispatch } from "react-redux";

interface AddLibraryPopoverProps {
  variant?: "primary" | "secondary";
}

const AddLibraryPopover = ({ variant = "primary" }: AddLibraryPopoverProps) => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const onOpenChange = useCallback(
    (open) => {
      dispatch(clearInstalls());
      setOpen(open);
    },
    [dispatch],
  );

  const openPopover = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  const buttonKind: ButtonKind =
    variant === "primary" ? "tertiary" : "secondary";

  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger>
        <Button
          className="t--install-library-button"
          isIconButton
          kind={buttonKind}
          onClick={openPopover}
          size="sm"
          startIcon="add-line"
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[25]"
        side="left"
        sideOffset={16}
        size="md"
      >
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
