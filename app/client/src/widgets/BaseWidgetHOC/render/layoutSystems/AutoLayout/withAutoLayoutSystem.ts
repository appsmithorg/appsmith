import { RenderModes } from "../../../../../constants/WidgetConstants";
import { withAutoLayoutEditor } from "./Editor/withAutoLayoutEditor";
import { withAutoLayoutViewer } from "./Viewer/withAutoLayoutViewer";

export const withAutoLayoutSystem = (renderMode: RenderModes) => {
  if (renderMode === RenderModes.CANVAS) {
    return withAutoLayoutEditor;
  } else {
    return withAutoLayoutViewer;
  }
};
