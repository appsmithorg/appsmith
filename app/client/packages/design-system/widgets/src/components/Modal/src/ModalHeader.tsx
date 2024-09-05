import React, { useLayoutEffect } from "react";
import { usePopoverContext } from "@appsmith/wds-headless";

import { Text } from "../../Text";
import { IconButton } from "../../IconButton";
import { Flex } from "../../Flex";
import { useId } from "@floating-ui/react";
import styles from "./styles.module.css";

import type { ModalHeaderProps } from "./types";

export const ModalHeader = (props: ModalHeaderProps) => {
  const { excludeFromTabOrder = false, title } = props;
  const { setLabelId, setOpen } = usePopoverContext();
  const id = useId();

  // Only sets `aria-labelledby` on the Dialog root element
  // if this component is mounted inside it.
  useLayoutEffect(() => {
    setLabelId(id);
    return () => setLabelId(undefined);
  }, [id, setLabelId]);

  return (
    <Flex
      alignItems="center"
      className={styles.header}
      gap="spacing-4"
      justifyContent="space-between"
    >
      <Text
        fontWeight={600}
        id={id}
        lineClamp={1}
        size="subtitle"
        title={title}
      >
        {title}
      </Text>
      <IconButton
        excludeFromTabOrder={excludeFromTabOrder}
        icon="x"
        onPress={() => setOpen(false)}
        variant="ghost"
      />
    </Flex>
  );
};
