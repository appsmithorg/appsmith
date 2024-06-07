import React, { useMemo } from "react";
import {
  LayoutComponentTypes,
  type LayoutComponentProps,
  type WidgetLayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { AlignmentIndexMap } from "layoutSystems/anvil/utils/constants";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { renderWidgets } from "layoutSystems/anvil/utils/layouts/renderUtils";
import { FlexLayout, type FlexLayoutProps } from "../FlexLayout";
import { isFillWidgetPresentInList } from "layoutSystems/anvil/utils/layouts/widgetUtils";

/**
 * If AlignedRow hasFillWidget:
 * then render all children directly within the AlignedRow (row / flex-start / wrap);
 * no need for alignments.
 *
 * Else:
 * render children in 3 alignments: start, center and end.
 * Each alignment has following characteristics:
 * 1. Mobile viewport:
 *   - flex-wrap: wrap.
 *   ~ This ensures the alignment takes up as much space as needed by the children.
 *   ~ It can stretch to the full width of the viewport.
 *   ~ or collapse completely if there is no content.
 *
 * 2. Larger view ports:
 *  - flex-wrap: nowrap.
 *  ~ This ensures that alignments share the total space equally, until possible.
 *  ~ Soon as the content in any alignment needs more space, it will wrap to the next line
 *    thanks to flex wrap in the parent layout.
 */
const AlignedWidgetRowComp = (props: LayoutComponentProps) => {
  const { canvasId, layout, layoutId } = props;

  const commonProps: Omit<
    FlexLayoutProps,
    "children" | "layoutId" | "layoutIndex"
  > = useMemo(() => {
    return {
      alignSelf: "stretch",
      canvasId,
      direction: "row",
      flexBasis: "0%",
      flexGrow: 1,
      flexShrink: 1,
      layoutType: LayoutComponentTypes.WIDGET_ROW,
      parentDropTarget: props.parentDropTarget,
      wrap: "wrap",
      className: props.className,
      maxWidth: "100%",
      width: "100%",
      minWidth: "fit-content",
    };
  }, []);

  // check if layout renders a Fill widget.
  const hasFillWidget: boolean = isFillWidgetPresentInList(
    layout as WidgetLayoutProps[],
  );

  // If a Fill widget exists, then render the child widgets together.
  if (hasFillWidget) {
    return <>{renderWidgets(props)}</>;
  }

  /**
   * else render the child widgets separately
   * in their respective alignments.
   */
  const startChildren: WidgetLayoutProps[] = (
    layout as WidgetLayoutProps[]
  ).filter(
    (each: WidgetLayoutProps) => each.alignment === FlexLayerAlignment.Start,
  );
  const centerChildren: WidgetLayoutProps[] = (
    layout as WidgetLayoutProps[]
  ).filter(
    (each: WidgetLayoutProps) => each.alignment === FlexLayerAlignment.Center,
  );
  const endChildren: WidgetLayoutProps[] = (
    layout as WidgetLayoutProps[]
  ).filter(
    (each: WidgetLayoutProps) => each.alignment === FlexLayerAlignment.End,
  );

  // TODO: After positionObserver integration,
  // check if use of FlexLayout is causing performance or other issues.
  // WDS Flex can be used as a replacement.
  return (
    <>
      <FlexLayout
        {...commonProps}
        justifyContent="start"
        key={`${layoutId}-${AlignmentIndexMap[FlexLayerAlignment.Start]}`}
        layoutId={`${layoutId}-${AlignmentIndexMap[FlexLayerAlignment.Start]}`}
        layoutIndex={AlignmentIndexMap[FlexLayerAlignment.Start]}
      >
        {renderWidgets({
          ...props,
          layout: startChildren,
        })}
      </FlexLayout>
      <FlexLayout
        {...commonProps}
        justifyContent="center"
        key={`${layoutId}-${AlignmentIndexMap[FlexLayerAlignment.Center]}`}
        layoutId={`${layoutId}-${AlignmentIndexMap[FlexLayerAlignment.Center]}`}
        layoutIndex={AlignmentIndexMap[FlexLayerAlignment.Center]}
      >
        {renderWidgets(
          {
            ...props,
            layout: centerChildren,
          },
          startChildren?.length,
        )}
      </FlexLayout>
      <FlexLayout
        {...commonProps}
        justifyContent="end"
        key={`${layoutId}-${AlignmentIndexMap[FlexLayerAlignment.End]}`}
        layoutId={`${layoutId}-${AlignmentIndexMap[FlexLayerAlignment.End]}`}
        layoutIndex={AlignmentIndexMap[FlexLayerAlignment.End]}
      >
        {renderWidgets(
          {
            ...props,
            layout: endChildren,
          },
          startChildren?.length + centerChildren?.length,
        )}
      </FlexLayout>
    </>
  );
};

export default AlignedWidgetRowComp;
