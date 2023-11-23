import React, { useState } from "react";
import { AddNewRowActions } from "../../Constants";
import styles from "./styles.module.css";
import { Text, Button, Flex } from "@design-system/widgets";

export interface AddNewRowBannerType {
  onAddNewRowAction: (
    type: AddNewRowActions,
    onActionComplete: () => void,
  ) => void;
  disabledAddNewRowSave: boolean;
}

function AddNewRowBannerComponent(props: AddNewRowBannerType) {
  const [isDiscardLoading, setIsDiscardLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);

  return (
    <Flex alignItems="center" gap="spacing-1" width="100%">
      <Text className={styles.bannerCaption} variant="caption">
        Add New Row
      </Text>
      <Button
        isDisabled={isSaveLoading}
        isLoading={isDiscardLoading}
        onPress={() => {
          setIsDiscardLoading(true);
          props.onAddNewRowAction(AddNewRowActions.DISCARD, () =>
            setIsDiscardLoading(false),
          );
        }}
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
      >
        Save row
      </Button>
    </Flex>
  );
}
export const AddNewRowBanner = React.memo(AddNewRowBannerComponent);
