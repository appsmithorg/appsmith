import { RenderModes } from "constants/WidgetConstants";
import { FixedLayoutEditorWrapper } from "./Editor/FixedLayoutEditorWrapper";
import { FixedLayoutViewerWrapper } from "./Viewer/FixedLayoutViewerWrapper";

export const getFixedLayoutSystemWrapper = (renderMode: RenderModes) => {
  if (renderMode === RenderModes.CANVAS) {
    return FixedLayoutEditorWrapper;
  } else {
    return FixedLayoutViewerWrapper;
  }
};
