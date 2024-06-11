import React, { memo, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getRenderMode } from "selectors/editorSelectors";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import withWidgetProps from "widgets/withWidgetProps";
import { getLayoutSystem } from "./withLayoutSystemWidgetHOC";

import { sendAnalyticsForSideBySideHover } from "actions/analyticsActions";

import { LAYOUT_WRAPPER_ID } from "./constants";
import styles from "./styles.module.css";
import useIsInSideBySideEditor from "utils/hooks/useIsInSideBySideEditor";

// ToDo(#27615): destructure withWidgetProps to withCanvasProps by picking only necessary props of a canvas.

/**
 * Canvas of a Layout System is the module that provides necessary utilities to position and order widgets.
 * Canvas also provides editing layout system specific editing experiences like Drag and Drop, Drag to Select, Widget Grouping, etc.
 * This Component Hydrates canvas with enhanced properties from withWidgetProps and picks the layout system specific Canvas Implementation.
 */

const LayoutSystemBasedCanvas = memo((props: WidgetProps) => {
  const dispatch = useDispatch();

  const renderMode = useSelector(getRenderMode);
  const layoutSystemType = useSelector(getLayoutSystemType);
  const { canvasSystem } = useMemo(
    () => getLayoutSystem(renderMode, layoutSystemType),
    [
      {
        renderMode,
        layoutSystemType,
      },
    ],
  );
  const { Canvas, propertyEnhancer } = canvasSystem;

  const isInSideBySideEditor = useIsInSideBySideEditor();
  const handleMouseLeave: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (
      isInSideBySideEditor &&
      e.relatedTarget instanceof Element &&
      e.relatedTarget.contains(document.getElementById(LAYOUT_WRAPPER_ID))
    ) {
      dispatch(sendAnalyticsForSideBySideHover());
    }
  };

  return (
    <div
      className={styles.root}
      id={LAYOUT_WRAPPER_ID}
      onMouseLeave={handleMouseLeave}
    >
      <Canvas {...propertyEnhancer(props)} />
    </div>
  );
});

const HydratedLayoutSystemBasedCanvas = withWidgetProps(
  LayoutSystemBasedCanvas as any,
);

export const renderAppsmithCanvas = (props: WidgetProps) => {
  return <HydratedLayoutSystemBasedCanvas {...props} />;
};
