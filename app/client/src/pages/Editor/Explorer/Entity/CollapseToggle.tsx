import React from "react";
import { Icon, IconName } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { Colors } from "constants/Colors";

export function CollapseToggle(props: {
  isOpen: boolean;
  isVisible: boolean;
  onClick: (e: any) => void;
  disabled: boolean;
  className: string;
}) {
  const handleClick = (e: any) => {
    props.onClick(e);
    e.stopPropagation();
  };
  const icon: IconName = props.isOpen
    ? IconNames.CARET_DOWN
    : IconNames.CARET_RIGHT;

  if (!props.isVisible) return <span />;
  return (
    <Icon
      className={props.className}
      color={props.disabled ? Colors.SLATE_GRAY : Colors.WHITE}
      icon={icon}
      onClick={handleClick}
    />
  );
}

export default CollapseToggle;
