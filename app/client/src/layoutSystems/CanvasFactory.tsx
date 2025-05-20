import React, { memo, useMemo } from "react";
import { useSelector } from "react-redux";
import { getRenderMode } from "selectors/editorSelectors";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import withWidgetProps from "widgets/withWidgetProps";
import { getLayoutSystem } from "./withLayoutSystemWidgetHOC";
import { getAppThemeSettings } from "ee/selectors/applicationSelectors";

// ToDo(#27615): destructure withWidgetProps to withCanvasProps by picking only necessary props of a canvas.

/**
 * Canvas of a Layout System is the module that provides necessary utilities to position and order widgets.
 * Canvas also provides editing layout system specific editing experiences like Drag and Drop, Drag to Select, Widget Grouping, etc.
 * This Component Hydrates canvas with enhanced properties from withWidgetProps and picks the layout system specific Canvas Implementation.
 */

const LayoutSystemBasedCanvas = memo((props: WidgetProps) => {
  let renderMode = useSelector(getRenderMode);
  const themeSetting = useSelector(getAppThemeSettings);

  // This is primarily used by UI modules in app editor where it wants to load all the underlying
  // widgets in page mode as they are not editable and mimics the behavior of view mode.
  // Since in app's edit mode the default render mode is canvas and due to this some widgets do not behave
  // properly.
  // Ideally the renderMode from props should be used instead of the one from the selector but that needs
  // to be handled properly as it needs a bigger change and more testing.
  if (props.overrideRenderMode) {
    renderMode = props.overrideRenderMode;
  }

  const layoutSystemType = useSelector(getLayoutSystemType);
  const { canvasSystem } = useMemo(
    () => getLayoutSystem(renderMode, layoutSystemType),
    [renderMode, layoutSystemType],
  );
  const { Canvas, propertyEnhancer } = canvasSystem;

  return (
    <Canvas {...propertyEnhancer(props)} maxWidth={themeSetting.appMaxWidth} />
  );
});

const HydratedLayoutSystemBasedCanvas = withWidgetProps(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LayoutSystemBasedCanvas as any,
);

export const renderAppsmithCanvas = (props: WidgetProps) => {
  return <HydratedLayoutSystemBasedCanvas {...props} />;
};
