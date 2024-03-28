import React, { useState } from "react";
import { Text, Button, Flex } from "@design-system/widgets";

import { AddNewRowActions } from "../Constants";

export interface AddNewRowBannerProps {
  onAddNewRowAction: (
    type: AddNewRowActions,
    onActionComplete: () => void,
  ) => void;
  disabledAddNewRowSave: boolean;
}

function AddNewRowBanner(props: AddNewRowBannerProps) {
  const [isDiscardLoading, setIsDiscardLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);

  return (
    <Flex alignItems="center" gap="spacing-1" width="100%">
      <Text variant="caption">Add New Row</Text>
      <Flex gap="spacing-1" marginLeft="auto">
        <Button
          isDisabled={isSaveLoading}
          isLoading={isDiscardLoading}
          onPress={() => {
            setIsDiscardLoading(true);
            props.onAddNewRowAction(AddNewRowActions.DISCARD, () =>
              setIsDiscardLoading(false),
            );
          }}
          size="small"
          variant="ghost"
        >
          Discard
        </Button>
        <Button
          isDisabled={props.disabledAddNewRowSave || isDiscardLoading}
          isLoading={isSaveLoading}
          onPress={() => {
            setIsSaveLoading(true);
            props.onAddNewRowAction(AddNewRowActions.SAVE, () =>
              setIsSaveLoading(false),
            );
          }}
          size="small"
        >
          Save row
        </Button>
      </Flex>
    </Flex>
  );
}

const MemoizedAddNewRowBanner = React.memo(AddNewRowBanner);

export { MemoizedAddNewRowBanner as AddNewRowBanner };
