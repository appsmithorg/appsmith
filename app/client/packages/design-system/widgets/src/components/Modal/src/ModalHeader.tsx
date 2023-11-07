import React, { useLayoutEffect } from "react";
import { usePopoverContext } from "@design-system/headless";
import { Text } from "../../Text";
import { IconButton } from "../../IconButton";
import { Flex } from "../../Flex";
import { CloseIcon } from "./CloseIcon";
import { useId } from "@floating-ui/react";

import type { ModalHeaderProps } from "./types";

export const ModalHeader = (props: ModalHeaderProps) => {
  const { title } = props;
  const { setLabelId, setOpen } = usePopoverContext();
  const id = useId();

  // Only sets `aria-labelledby` on the Dialog root element
  // if this component is mounted inside it.
  useLayoutEffect(() => {
    setLabelId(id);
    return () => setLabelId(undefined);
  }, [id, setLabelId]);

  return (
    <Flex alignItems="center" gap="spacing-4" justifyContent="space-between">
      <Text id={id} lineClamp={1} title={title} variant="caption">
        {title}
      </Text>
      <IconButton
        icon={CloseIcon}
        onPress={() => setOpen(false)}
        variant="ghost"
      />
    </Flex>
  );
};
