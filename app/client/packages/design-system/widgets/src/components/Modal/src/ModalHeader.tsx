import React, { useLayoutEffect } from "react";
import { usePopoverContext } from "@design-system/headless";

import { Text } from "../../Text";
import { IconButton } from "../../IconButton";
import { Flex } from "../../Flex";
import { useId } from "@floating-ui/react";

import type { ModalHeaderProps } from "./types";

export const ModalHeader = (props: ModalHeaderProps) => {
  const { title } = props;
  const { onClose, setLabelId, setOpen } = usePopoverContext();
  const id = useId();

  // Only sets `aria-labelledby` on the Dialog root element
  // if this component is mounted inside it.
  useLayoutEffect(() => {
    setLabelId(id);
    return () => setLabelId(undefined);
  }, [id, setLabelId]);

  const closeHandler = () => {
    onClose && onClose();
    setOpen(false);
  };

  return (
    <Flex alignItems="center" gap="spacing-4" justifyContent="space-between">
      <Text id={id} lineClamp={1} title={title} variant="caption">
        {title}
      </Text>
      <IconButton icon="x" onPress={closeHandler} variant="ghost" />
    </Flex>
  );
};
