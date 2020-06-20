import React from "react";
import { MenuIcons } from "icons/MenuIcons";
import { Colors } from "constants/Colors";
import { WidgetType } from "constants/WidgetConstants";
import { WidgetIcons } from "icons/WidgetIcons";

const ENTITY_ICON_SIZE = 14;

const PageIcon = MenuIcons.PAGES_ICON;
export const pageIcon = (
  <PageIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.WHITE}
  />
);

const WidgetIcon = MenuIcons.WIDGETS_ICON;
export const widgetIcon = (
  <WidgetIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.WHITE}
  />
);

const ApiIcon = MenuIcons.APIS_ICON;
export const apiIcon = (
  <ApiIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.WHITE}
  />
);

const QueryIcon = MenuIcons.QUERIES_ICON;
export const queryIcon = (
  <QueryIcon
    width={ENTITY_ICON_SIZE}
    height={ENTITY_ICON_SIZE}
    color={Colors.WHITE}
  />
);

export const getWidgetIcon = (type: WidgetType) => {
  const WidgetIcon = WidgetIcons[type];
  if (WidgetIcon)
    return <WidgetIcon width={ENTITY_ICON_SIZE} height={ENTITY_ICON_SIZE} />;
  return null;
};
