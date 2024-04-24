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

  const Svg = useWidgetConfig(type, "iconSVG");

  if (Svg) {
    return (
      <IconWrapper height={height} width={width}>
        {typeof Svg === "string" && <img src={Svg} />}
        {typeof Svg !== "string" && React.isValidElement(<Svg />) && <Svg />}
      </IconWrapper>
    );
  }

  return null;
}

export default WidgetIcon;
