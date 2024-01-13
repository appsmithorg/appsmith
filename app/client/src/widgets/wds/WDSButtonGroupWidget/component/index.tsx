import type { Key } from "react";
import React, { useState } from "react";
import { ActionGroup, Item } from "@design-system/widgets";
import type {
  ButtonGroupComponentProps,
  ButtonGroupItemComponentProps,
} from "./types";
import { Icon as BIcon } from "@blueprintjs/core";
import { sortBy } from "lodash";

export const ButtonGroupComponent = (props: ButtonGroupComponentProps) => {
  const [loadingButtonIds, setLoadingButtonIds] = useState<
    Array<ButtonGroupItemComponentProps["id"]>
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

  const onActionComplete = (button: ButtonGroupItemComponentProps) => {
    const newLoadingButtonIds = [...loadingButtonIds];
    const index = newLoadingButtonIds.indexOf(button.id);

    if (index > -1) {
      newLoadingButtonIds.splice(index, 1);
    }

    setLoadingButtonIds(newLoadingButtonIds);
  };

  const onAction = (key: Key) => {
    const clickedItemIndex = sortedButtons.findIndex((item) => item.id === key);

    if (clickedItemIndex > -1) {
      if (props.buttonsList[clickedItemIndex].onClick) {
        setLoadingButtonIds([
          ...loadingButtonIds,
          sortedButtons[clickedItemIndex].id,
        ]);

        props.onButtonClick(sortedButtons[clickedItemIndex].onClick, () =>
          onActionComplete(sortedButtons[clickedItemIndex]),
        );
      }
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
      {sortedButtons.map((button: ButtonGroupItemComponentProps) => {
        const icon =
          button.iconName &&
          (() => {
            return <BIcon icon={button.iconName} />;
          });

        return (
          <Item
            icon={icon}
            iconPosition={button.iconAlign}
            isLoading={loadingButtonIds.includes(button.id)}
            key={button.id}
          >
            {button.label}
          </Item>
        );
      })}
    </ActionGroup>
  );
};
