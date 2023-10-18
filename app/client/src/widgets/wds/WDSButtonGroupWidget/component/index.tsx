import React, { useState } from "react";
import { ButtonGroup, ButtonGroupItem } from "@design-system/widgets";
import type {
  ButtonGroupComponentProps,
  ButtonGroupItemComponentProps,
} from "./types";
import { Icon as BIcon } from "@blueprintjs/core";

export const ButtonGroupComponent = (props: ButtonGroupComponentProps) => {
  const [loadingButtonIds, setLoadingButtonIds] = useState<
    Array<ButtonGroupItemComponentProps["id"]>
  >([]);

  return (
    <ButtonGroup
      color={props.color}
      orientation={props.orientation}
      variant={props.variant}
    >
      {Object.keys(props.buttonsList).map((key) => {
        const button: ButtonGroupItemComponentProps = props.buttonsList[key];

        const icon =
          button.iconName &&
          (() => {
            return <BIcon icon={button.iconName} />;
          });

        const hasOnClickAction = () => {
          return Boolean(button.onClick && !button.isDisabled);
        };

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

        const onPress = (() => {
          if (hasOnClickAction()) {
            return onButtonClick;
          }

          return undefined;
        })();

        return (
          <ButtonGroupItem
            icon={icon}
            iconPosition={button.iconAlign}
            isDisabled={button.isDisabled}
            isLoading={loadingButtonIds.includes(button.id)}
            key={button.id}
            onPress={onPress}
          >
            {button.label}
          </ButtonGroupItem>
        );
      })}
    </ButtonGroup>
  );
};
