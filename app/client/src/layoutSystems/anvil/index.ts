import { RenderModes } from "constants/WidgetConstants";
import { AnvilEditorWrapper } from "./editor/AnvilEditorWrapper";
import { AnvilViewerWrapper } from "./viewer/AnvilViewerWrapper";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import type { LayoutSystem } from "layoutSystems/types";
import { AnvilEditorCanvas } from "./editor/canvas/AnvilEditorCanvas";
import { AnvilViewerCanvas } from "./viewer/canvas/AnvilViewerCanvas";

/**
 * getAnvilSystemPropsEnhancer
 *
 * utility function to enhance BaseWidgetProps with Anvil specific props
 *
 */
const getAnvilSystemPropsEnhancer = (props: BaseWidgetProps) => {
  return {
    ...props,
    disableWidgetInteraction:
      props.renderMode === RenderModes.CANVAS && !props.isPreviewMode,
  };
};

const getAnvilSystemWrapper = (renderMode: RenderModes) => {
  if (renderMode === RenderModes.CANVAS) return AnvilEditorWrapper;

  return AnvilViewerWrapper;
};

/**
 * getAnvilCanvasWrapper
 *
 * utility function to return the anvil system canvas implementation.
 *
 * @returns current canvas component.
 */
const getAnvilCanvasWrapper = (renderMode: RenderModes) => {
  if (renderMode === RenderModes.CANVAS) return AnvilEditorCanvas;

  return AnvilViewerCanvas;
};

/**
 * getAnvilCanvasPropsEnhancer
 *
 * utility function to return the anvil system wrapper.
 * wrapper is the component that wraps around a widget to provide layout-ing ability and enable editing experience.
 *
 * @returns current render mode specific wrapper.
 */
const getAnvilCanvasPropsEnhancer = (props: BaseWidgetProps) => {
  return props;
};

export function getAnvilLayoutSystem(renderMode: RenderModes): LayoutSystem {
  return {
    canvasSystem: {
      Canvas: getAnvilCanvasWrapper(renderMode),
      propertyEnhancer: getAnvilCanvasPropsEnhancer,
    },
    widgetSystem: {
      WidgetWrapper: getAnvilSystemWrapper(renderMode),
      propertyEnhancer: getAnvilSystemPropsEnhancer,
    },
  };
}
