import React from "react";
import WidgetFactory from "WidgetProvider/factory";
import WidgetIcon from "pages/Editor/Explorer/Widgets/WidgetIcon";

interface WidgetTypeIconProps {
  type: string;
}

export const WidgetTypeIcon: React.FC<WidgetTypeIconProps> = React.memo(
  ({ type }) => {
    const { IconCmp } = WidgetFactory.getWidgetMethods(type);

    if (IconCmp) {
      return <IconCmp />;
    }

    return <WidgetIcon type={type} />;
  },
);

WidgetTypeIcon.displayName = "WidgetTypeIcon";
