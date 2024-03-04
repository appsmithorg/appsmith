import type { Key } from "react";
import React, { useState } from "react";
import { ActionGroup, Item } from "@design-system/widgets";
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
      color={props.color}
      density={props.density}
      disabledKeys={disabledKeys}
      onAction={onAction}
      orientation={props.orientation}
      variant={props.variant}
    >
      {sortedButtons.map((button: ToolbarButtonsItemComponentProps) => {
        return (
          <Item
            icon={button.iconName}
            iconPosition={button.iconAlign}
            isLoading={loadingButtonIds.includes(button.id)}
            isSeparator={button.itemType === "SEPARATOR"}
            key={button.id}
          >
            {button.label}
          </Item>
        );
      })}
    </ActionGroup>
  );
};
