import React from "react";
import WidgetFactory from "WidgetProvider/factory";
import WidgetIcon from "pages/Editor/Explorer/Widgets/WidgetIcon";

export const WidgetTypeIcon = (type: string) => {
  const { IconCmp } = WidgetFactory.getWidgetMethods(type);

  if (IconCmp) {
    return <IconCmp />;
  }

  return <WidgetIcon type={type} />;
};
