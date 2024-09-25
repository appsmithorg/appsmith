import type { Key } from "react";
import React, { useState } from "react";
import { InlineButtons } from "@appsmith/wds";
import type {
  InlineButtonsComponentProps,
  InlineButtonsItemComponentProps,
} from "./types";
import { sortBy } from "lodash";

export const InlineButtonsComponent = (props: InlineButtonsComponentProps) => {
  const [loadingButtonIds, setLoadingButtonIds] = useState<
    Array<InlineButtonsItemComponentProps["id"]>
  >([]);

  const { buttonsList, excludeFromTabOrder, onButtonClick } = props;

  const sortedButtons = sortBy(
    Object.keys(buttonsList)
      .map((key) => buttonsList[key])
      .filter((button) => {
        return button.isVisible === true;
      }),
    ["index"],
  );

  const disabledKeys = Object.keys(buttonsList)
    .map((key) => buttonsList[key])
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
    if (buttonsList[key].onClick) {
      setLoadingButtonIds([...loadingButtonIds, key as string]);

      onButtonClick(buttonsList[key].onClick, () =>
        onActionComplete(buttonsList[key]),
      );
    }
  };

  return (
    <InlineButtons
      disabledKeys={disabledKeys}
      excludeFromTabOrder={excludeFromTabOrder}
      items={sortedButtons}
      onAction={onAction}
    />
  );
};
