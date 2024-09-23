import React from "react";
import { Icon } from "@appsmith/ads";

export function CollapseToggle(props: {
  isOpen: boolean;
  isVisible: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick: (e: any) => void;
  disabled: boolean;
  className: string;
}) {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
