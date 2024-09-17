import React from "react";
import { IconButton, Tooltip } from "@appsmith/wds";

import type { IconButtonComponentProps } from "./types";

export const IconButtonComponent = (props: IconButtonComponentProps) => {
  const { iconName, tooltip, ...rest } = props;

  return (
    <Tooltip tooltip={tooltip}>
      <IconButton icon={iconName} {...rest} />
    </Tooltip>
  );
};
