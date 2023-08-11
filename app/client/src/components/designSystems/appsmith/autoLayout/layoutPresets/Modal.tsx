import React from "react";
import type {
  HighlightInfo,
  LayoutComponentProps,
} from "utils/autoLayout/autoLayoutTypes";
import FlexLayout from "../layoutComponents/FlexLayout";
import { renderLayouts } from "utils/autoLayout/layoutComponentUtils";
import type { WidgetPositions } from "reducers/entityReducers/widgetPositionsReducer";

const Modal = (props: LayoutComponentProps) => {
  const { childrenMap, containerProps, layoutId } = props;
  const layout: LayoutComponentProps[] = props.layout as LayoutComponentProps[];
  if (!childrenMap || !containerProps || !layout) return null;
  return (
    <FlexLayout
      canvasId={containerProps?.widgetId}
      flexDirection="column"
      layoutId={layoutId}
      padding={4}
    >
      <FlexLayout
        alignSelf="stretch"
        canvasId={containerProps?.widgetId}
        flexDirection="row"
        layoutId={layoutId + "_0"}
      >
        {renderLayouts([layout[0], layout[1]], childrenMap, containerProps)}
      </FlexLayout>
      <FlexLayout
        alignSelf="stretch"
        canvasId={containerProps?.widgetId}
        flexDirection="row"
        flexWrap="wrap"
        height="auto"
        layoutId={layoutId + "_1"}
        maxHeight={300}
        overflow="auto"
      >
        {renderLayouts([layout[2]], childrenMap, containerProps)}
      </FlexLayout>
      {renderLayouts([layout[3]], childrenMap, containerProps)}
    </FlexLayout>
  );
};

Modal.deriveHighlights = (): HighlightInfo[] => [];

Modal.addChild = (props: LayoutComponentProps): LayoutComponentProps => props;

Modal.removeChild = (props: LayoutComponentProps): LayoutComponentProps =>
  props;

Modal.getHeight = (
  layoutProps: LayoutComponentProps,
  widgetPositions: WidgetPositions,
): number => {
  const { containerProps } = layoutProps;
  if (!containerProps || !containerProps.widgetId || !widgetPositions) return 0;
  return widgetPositions[containerProps.widgetId]?.height;
};

export default Modal;
