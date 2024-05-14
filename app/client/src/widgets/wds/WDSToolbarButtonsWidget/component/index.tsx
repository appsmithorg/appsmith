import type { Key } from "react";
import React, { useState } from "react";
import { ActionGroup } from "@design-system/widgets";
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

  const onActionComplete = (button: ToolbarButtonsItemComponentProps) => {
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
    <ActionGroup
      alignment={props.alignment}
      color={props.color}
      disabledKeys={disabledKeys}
      items={sortedButtons}
      onAction={onAction}
      variant={props.variant}
    />
  );
};
