import type { Key } from "react";
import React, { useState } from "react";
import { ToolbarButtons } from "@design-system/widgets";
import type {
  ToolbarButtonsComponentProps,
  ToolbarButtonsItemComponentProps,
} from "./types";
import { sortBy } from "lodash";

export const ToolbarButtonsComponent = (
  props: ToolbarButtonsComponentProps,
) => {
  const [loadingButtonIds, setLoadingButtonIds] = useState<
    Array<ToolbarButtonsItemComponentProps["id"]>
  >([]);

  const { alignment, buttonsList, color, onButtonClick, variant } = props;

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
      return button.isDisabled;
    })
    .map((button) => button.id);

  const onActionComplete = (button: ToolbarButtonsItemComponentProps) => {
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
    <ToolbarButtons
      alignment={alignment}
      color={color}
      disabledKeys={disabledKeys}
      items={sortedButtons}
      onAction={onAction}
      variant={variant}
    />
  );
};
