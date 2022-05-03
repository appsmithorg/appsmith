import { IconWrapper } from "constants/IconConstants";
import { WidgetType } from "constants/WidgetConstants";
import React from "react";
import { useSelector } from "react-redux";
import { getWidgetConfigs } from "selectors/editorSelectors";
import { ENTITY_ICON_SIZE } from "../ExplorerIcons";

function WidgetIcon(props: {
  type: WidgetType;
  width?: number;
  height?: number;
}) {
  const { height = ENTITY_ICON_SIZE, type, width = ENTITY_ICON_SIZE } = props;
  const widgetConfig = useSelector(getWidgetConfigs);
  if (!type) return null;
  const svg = widgetConfig.config[type].iconSVG;
  if (svg)
    return (
      <IconWrapper height={height} width={width}>
        <img src={svg} />
      </IconWrapper>
    );
  return null;
}

export default WidgetIcon;
