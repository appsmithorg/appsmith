import React from "react";
import { Icon as BIcon } from "@blueprintjs/core";
import { IconButton, Tooltip } from "@design-system/widgets";
import type { IconButtonComponentProps } from "./types";

function IconButtonComponent(props: IconButtonComponentProps) {
  const { iconName, tooltip, ...rest } = props;
  const icon =
    iconName &&
    (() => {
      return <BIcon icon={iconName} />;
    });

  const renderIconButton = <IconButton icon={icon} {...rest} />;

  if (tooltip) {
    return <Tooltip tooltip={tooltip}>{renderIconButton}</Tooltip>;
  }

  return renderIconButton;
}

export default IconButtonComponent;
