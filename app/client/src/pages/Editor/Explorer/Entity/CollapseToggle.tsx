import React from "react";
import type { AppIconName } from "design-system-old";
import { AppIcon as Icon, Size } from "design-system-old";

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
  const icon: AppIconName = props.isOpen ? "arrow-down" : "arrow-right";

  if (!props.isVisible) return <span />;
  return (
    <Icon
      className={props.className}
      name={icon}
      onClick={handleClick}
      size={Size.small}
    />
  );
}

export default CollapseToggle;
