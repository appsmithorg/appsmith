import React from "react";
import type { LayoutComponentProps } from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayout } from "../FlexLayout";
import { useSelector } from "react-redux";
import { getZoneMinWidth } from "layoutSystems/anvil/integrations/selectors";

export const ZoneColumn = (props: LayoutComponentProps) => {
  const {
    canvasId,
    childrenMap,
    isContainer,
    isDropTarget,
    layoutId,
    layoutIndex,
    layoutStyle,
    layoutType,
    parentDropTarget,
    renderMode,
  } = props;

  const minWidth: string = useSelector(getZoneMinWidth(childrenMap));

  return (
    <FlexLayout
      alignSelf={"stretch"}
      canvasId={canvasId}
      direction="column"
      flexGrow={1}
      flexShrink={1}
      isContainer={!!isContainer}
      isDropTarget={!!isDropTarget}
      layoutId={layoutId}
      layoutIndex={layoutIndex}
      layoutType={layoutType}
      minWidth={minWidth}
      parentDropTarget={parentDropTarget}
      renderMode={renderMode}
      {...(layoutStyle || {})}
    >
      {props.children}
    </FlexLayout>
  );
};
