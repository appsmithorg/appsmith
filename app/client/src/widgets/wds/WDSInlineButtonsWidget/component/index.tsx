import type { Key } from "react";
import React, { useState } from "react";
import { ButtonGroup } from "@design-system/widgets";
import type {
  InlineButtonsComponentProps,
  InlineButtonsItemComponentProps,
} from "./types";
import { sortBy } from "lodash";

export const InlineButtonsComponent = (props: InlineButtonsComponentProps) => {
  const [loadingButtonIds, setLoadingButtonIds] = useState<
    Array<InlineButtonsItemComponentProps["id"]>
  >([]);

  const sortedButtons = sortBy(
    Object.keys(props.buttonsList)
      .map((key) => props.buttonsList[key])
      .filter((button) => {
        return button.isVisible === true;
      }),
    ["index"],
  );

  const disabledKeys = Object.keys(props.buttonsList)
    .map((key) => props.buttonsList[key])
    .filter((button) => {
      return button.isDisabled === true;
    })
    .map((button) => button.id);

  const onActionComplete = (button: InlineButtonsItemComponentProps) => {
    const newLoadingButtonIds = [...loadingButtonIds];
    const index = newLoadingButtonIds.indexOf(button.id);

    if (index > -1) {
      newLoadingButtonIds.splice(index, 1);
    }

    setLoadingButtonIds(newLoadingButtonIds);
  };

  const onAction = (key: Key) => {
    if (props.buttonsList[key].onClick) {
      setLoadingButtonIds([...loadingButtonIds, key as string]);

      props.onButtonClick(props.buttonsList[key].onClick, () =>
        onActionComplete(props.buttonsList[key]),
      );
    }
  };

  return (
    <ButtonGroup
      disabledKeys={disabledKeys}
      items={sortedButtons}
      onAction={onAction}
    />
  );
};
