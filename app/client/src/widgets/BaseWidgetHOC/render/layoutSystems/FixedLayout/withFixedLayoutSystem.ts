import { RenderModes } from "constants/WidgetConstants";
import { withFixedLayoutEditor } from "./Editor/withFixedLayoutEditor";
import { withFixedLayoutViewer } from "./Viewer/withFixedLayoutViewer";

export const withFixedLayoutSystem = (renderMode: RenderModes) => {
  if (renderMode === RenderModes.CANVAS) {
    return withFixedLayoutEditor;
  } else {
    return withFixedLayoutViewer;
  }
};
