import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutComponentTypes,
  type LayoutComponentProps,
  type WidgetLayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import {
  AlignmentIndexMap,
  MOBILE_BREAKPOINT,
} from "layoutSystems/anvil/utils/constants";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { renderWidgets } from "layoutSystems/anvil/utils/layouts/renderUtils";
import { isEditOnlyModeSelector } from "../../../../../selectors/editorSelectors";
import { FlexLayout, type FlexLayoutProps } from "../FlexLayout";
import { isFillWidgetPresentInList } from "layoutSystems/anvil/utils/layouts/widgetUtils";
import { getAnvilLayoutDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import {
  ALIGNMENT_WIDTH_THRESHOLD,
  shouldOverrideAlignmentStyle,
} from "layoutSystems/anvil/integrations/layoutSelectors";
import { useSelector } from "react-redux";
import { RenderModes } from "constants/WidgetConstants";

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
 *   - flex-basis: auto.
 *   ~ This ensures the alignment takes up as much space as needed by the children.
 *   ~ It can stretch to the full width of the viewport.
 *   ~ or collapse completely if there is no content.
 *
 * 2. Larger view ports:
 *  - flex-wrap: nowrap.
 *  - flex-basis: 0%.
 *  ~ This ensures that alignments share the total space equally, until possible.
 *  ~ Soon as the content in any alignment needs more space, it will wrap to the next line
 *    thanks to flex wrap in the parent layout.
 */
const AlignedWidgetRowComp = (props: LayoutComponentProps) => {
  const { canvasId, layout, layoutId, renderMode } = props;
  // Whether default alignment styles should be overridden, when renderMode = Canvas.
  const shouldOverrideStyle: boolean = useSelector(
    shouldOverrideAlignmentStyle(layoutId),
  );

  // check if layout renders a Fill widget.
  const hasFillWidget: boolean = isFillWidgetPresentInList(
    layout as WidgetLayoutProps[],
  );

  const [isAnyAlignmentOverflowing, setIsAnyAlignmentOverflowing] =
    useState(false);

  useEffect(() => {
    // getBoundingClientRect is an expensive operation and should only be used when renderMode = Page,
    // because layout positions are not available in that case.
    if (hasFillWidget || renderMode !== RenderModes.PAGE) return;
    const parentLayoutId = getAnvilLayoutDOMId(canvasId, layoutId);
    const parentLayout = document.getElementById(parentLayoutId);
    if (parentLayout) {
      const parentLayoutWidth = parentLayout.getBoundingClientRect().width;

      // Use requestAnimationFrame to ensure calculation is done after rendering
      requestAnimationFrame(() => {
        const isOverflowing = [
          FlexLayerAlignment.Start,
          FlexLayerAlignment.Center,
          FlexLayerAlignment.End,
        ].some((each: FlexLayerAlignment) => {
          const alignmentId = `${parentLayoutId}-${AlignmentIndexMap[each]}`;
          const alignment = document.getElementById(alignmentId);
          if (!alignment) return false;
          const alignmentWidth = alignment.getBoundingClientRect().width;
          // return true if width of any alignment exceeds the limit.
          return (
            alignmentWidth >= parentLayoutWidth * ALIGNMENT_WIDTH_THRESHOLD
          );
        });
        setIsAnyAlignmentOverflowing(isOverflowing);
      });
    }
  }, [hasFillWidget, layout.length, renderMode]);

  useEffect(() => {
    if (hasFillWidget || renderMode === RenderModes.PAGE) return;
    setIsAnyAlignmentOverflowing(shouldOverrideStyle);
  }, [hasFillWidget, renderMode, shouldOverrideStyle]);

  const isEditMode = useSelector(isEditOnlyModeSelector);
  const isStartVisible = () => startChildren.length > 0 || isEditMode;
  const isCenterVisible = () => centerChildren.length > 0 || isEditMode;
  const isEndVisible = () => endChildren.length > 0 || isEditMode;

  const commonProps: Omit<
    FlexLayoutProps,
    "children" | "layoutId" | "layoutIndex"
  > = useMemo(() => {
    return {
      alignSelf: "stretch",
      canvasId,
      direction: "row",
      flexBasis: isAnyAlignmentOverflowing
        ? { base: "auto" }
        : { base: "auto", [`${MOBILE_BREAKPOINT}px`]: "0%" },
      flexGrow: 1,
      flexShrink: 1,
      layoutType: LayoutComponentTypes.WIDGET_ROW,
      parentDropTarget: props.parentDropTarget,
      renderMode: props.renderMode,
      wrap: isAnyAlignmentOverflowing
        ? { base: "wrap" }
        : { base: "wrap", [`${MOBILE_BREAKPOINT}px`]: "nowrap" },
      className: props.className,
      maxWidth: "100%",
    };
  }, [isAnyAlignmentOverflowing]);

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
      {isStartVisible() && (
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
      )}
      {isCenterVisible() && (
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
      )}
      {isEndVisible() && (
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
      )}
    </>
  );
};

export default AlignedWidgetRowComp;
