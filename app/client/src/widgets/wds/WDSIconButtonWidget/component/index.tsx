import React from "react";
import { Icon as BIcon } from "@blueprintjs/core";
import { IconButton, Tooltip } from "@design-system/widgets";
import type { IconButtonComponentProps } from "./types";

export const IconButtonComponent = (props: IconButtonComponentProps) => {
  const { iconName, tooltip, ...rest } = props;
  const icon =
    iconName &&
    (() => {
      return <BIcon icon={iconName} />;
    });

  return (
    <Tooltip tooltip={tooltip}>
      <IconButton icon={icon} {...rest} />
    </Tooltip>
  );
};
