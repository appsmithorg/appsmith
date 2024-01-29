import React, { useState } from "react";
import { usePopoverContext } from "@design-system/headless";
import { Flex } from "../../Flex";
import { Button } from "../../Button";

import type { ModalFooterProps } from "./types";

export const ModalFooter = (props: ModalFooterProps) => {
  const { closeText = "Close", onSubmit, submitText = "Submit" } = props;
  const { onClose, setOpen } = usePopoverContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (onSubmit) {
      setIsLoading(true);
      await onSubmit();
      setIsLoading(false);
      setOpen(false);
    }
  };

  const closeHandler = () => {
    onClose && onClose();
    setOpen(false);
  };

  return (
    <Flex alignItems="center" gap="spacing-4" justifyContent="end">
      <Button onPress={closeHandler} variant="ghost">
        {closeText}
      </Button>

      {onSubmit && (
        <Button isLoading={isLoading} onPress={handleSubmit}>
          {submitText}
        </Button>
      )}
    </Flex>
  );
};
