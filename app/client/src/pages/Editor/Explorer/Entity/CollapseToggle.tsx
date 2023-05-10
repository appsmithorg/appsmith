import React from "react";
import { Icon } from "design-system";

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
  const icon = props.isOpen ? "arrow-down-s-line" : "arrow-right-s-line";

  if (!props.isVisible) return <span />;

  return (
    <Icon
      className={props.className}
      id={icon}
      name={icon}
      onClick={handleClick}
      size={"md"}
    />
  );
}

export default CollapseToggle;
