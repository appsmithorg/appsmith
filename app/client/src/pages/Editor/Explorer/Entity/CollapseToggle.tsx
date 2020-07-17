import React from "react";
import { Icon, IconName } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { Colors } from "constants/Colors";

export const CollapseToggle = (props: {
  isOpen: boolean;
  isVisible: boolean;
  onClick: () => void;
  disabled: boolean;
}) => {
  const handleClick = (e: any) => {
    props.onClick();
    e.stopPropagation();
  };
  const icon: IconName = props.isOpen
    ? IconNames.CARET_DOWN
    : IconNames.CARET_RIGHT;

  if (!props.isVisible) return <span></span>;
  return (
    <Icon
      icon={icon}
      onClick={handleClick}
      color={props.disabled ? Colors.SLATE_GRAY : Colors.WHITE}
    />
  );
};

export default CollapseToggle;
