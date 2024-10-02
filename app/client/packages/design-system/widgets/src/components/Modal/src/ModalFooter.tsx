import React, { useState } from "react";
import { usePopoverContext } from "@appsmith/wds-headless";
import { Flex } from "../../Flex";
import { Button } from "../../Button";

import type { ModalFooterProps } from "./types";

export const ModalFooter = (props: ModalFooterProps) => {
  const {
    closeOnSubmit = true,
    closeText = "Close",
    excludeFromTabOrder = false,
    onSubmit,
    submitText = "Submit",
  } = props;
  const { setOpen } = usePopoverContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (onSubmit) {
      setIsLoading(true);
      await onSubmit();
      setIsLoading(false);

      if (closeOnSubmit) setOpen(false);
    }
  };

  return (
    <Flex alignItems="center" gap="spacing-4" justifyContent="end">
      <Button
        excludeFromTabOrder={excludeFromTabOrder}
        onPress={() => setOpen(false)}
        variant="ghost"
      >
        {closeText}
      </Button>

      {onSubmit && (
        <Button
          excludeFromTabOrder={excludeFromTabOrder}
          isLoading={isLoading}
          onPress={handleSubmit}
        >
          {submitText}
        </Button>
      )}
    </Flex>
  );
};
