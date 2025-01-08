import React from "react";
import type { WidgetType } from "constants/WidgetConstants";
import WidgetFactory from "WidgetProvider/factory";

interface WidgetTypeIconProps {
  type: WidgetType;
}

export const WidgetTypeIcon: React.FC<WidgetTypeIconProps> = ({ type }) => {
  const { IconCmp } = WidgetFactory.getWidgetMethods(type);
  return IconCmp ? <IconCmp /> : null;
};
