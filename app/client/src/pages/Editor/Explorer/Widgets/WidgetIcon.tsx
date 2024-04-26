import { IconWrapper } from "constants/IconConstants";
import type { WidgetType } from "constants/WidgetConstants";
import React from "react";
import useWidgetConfig from "utils/hooks/useWidgetConfig";
import { ENTITY_ICON_SIZE } from "../ExplorerIcons";

function WidgetIcon(props: {
  type: WidgetType;
  width?: number;
  height?: number;
}) {
  const { height = ENTITY_ICON_SIZE, type, width = ENTITY_ICON_SIZE } = props;

  const svg = useWidgetConfig(type, "iconSVG");

  if (svg) {
    return (
      <IconWrapper height={height} width={width}>
        <img src={svg} />
      </IconWrapper>
    );
  }

  return null;
}

export default WidgetIcon;
