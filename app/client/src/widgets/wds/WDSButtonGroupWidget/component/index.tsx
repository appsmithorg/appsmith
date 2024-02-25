import type { Key } from "react";
import React, { useState } from "react";
import { ActionGroup, Item } from "@design-system/widgets";
import type {
  ButtonGroupComponentProps,
  ButtonGroupItemComponentProps,
} from "./types";
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
      {sortedButtons.map((button: ButtonGroupItemComponentProps) => {
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
