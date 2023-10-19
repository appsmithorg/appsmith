import React, { useState } from "react";
import { ButtonGroup, ButtonGroupItem } from "@design-system/widgets";
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

  return (
    <ButtonGroup
      color={props.color}
      orientation={props.orientation}
      variant={props.variant}
    >
      {sortedButtons.map((button: ButtonGroupItemComponentProps) => {
        const icon =
          button.iconName &&
          (() => {
            return <BIcon icon={button.iconName} />;
          });

        const handleActionComplete = () => {
          const newLoadingButtonIds = [...loadingButtonIds];
          const index = newLoadingButtonIds.indexOf(button.id);

          if (index > -1) {
            newLoadingButtonIds.splice(index, 1);
          }

          setLoadingButtonIds(newLoadingButtonIds);
        };

        const onButtonClick = () => {
          if (button.onClick) {
            setLoadingButtonIds([...loadingButtonIds, button.id]);

            props.onButtonClick(button.onClick, handleActionComplete);
          }
        };

        return (
          <ButtonGroupItem
            icon={icon}
            iconPosition={button.iconAlign}
            isDisabled={button.isDisabled}
            isLoading={loadingButtonIds.includes(button.id)}
            key={button.id}
            onPress={onButtonClick}
          >
            {button.label}
          </ButtonGroupItem>
        );
      })}
    </ButtonGroup>
  );
};
