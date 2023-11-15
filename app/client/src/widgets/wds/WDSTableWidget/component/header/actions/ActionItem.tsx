import React, { forwardRef } from "react";
import { importSvg } from "design-system-old";
import { Button, Tooltip } from "@design-system/widgets";

import type { ButtonRef as HeadlessButtonRef } from "@design-system/headless";
import type { PressEvent } from "@react-types/shared/src/events";

const FilterIcon = importSvg(
  async () => import("assets/icons/control/filter-icon.svg"),
);
const DownloadIcon = importSvg(
  async () => import("assets/icons/control/download-data-icon.svg"),
);
const AddIcon = importSvg(async () => import("assets/icons/control/add.svg"));

interface ActionItemProps {
  onPress?: (e: PressEvent) => void;
  icon: string;
  title: string;
  disabled?: boolean;
  disabledMessage?: string;
}

export const _ActionItem = (props: ActionItemProps, ref: HeadlessButtonRef) => {
  const { disabled, disabledMessage, icon, onPress, title, ...rest } = props;

  const getIcon = () => {
    switch (icon) {
      case "download":
        return DownloadIcon;
      case "filter":
        return FilterIcon;
      case "add":
        return AddIcon;
      default:
        return undefined;
    }
  };

  const item = (
    <Button
      icon={getIcon()}
      onPress={onPress}
      ref={ref}
      variant="ghost"
      {...rest}
    >
      {title}
    </Button>
  );

  if (disabled && disabledMessage) {
    return <Tooltip tooltip={disabledMessage}>{item}</Tooltip>;
  } else {
    return item;
  }
};

export const ActionItem = forwardRef(_ActionItem);
