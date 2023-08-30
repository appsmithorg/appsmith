import { RenderModes } from "../../constants/WidgetConstants";
import { AutoLayoutEditorWraper } from "./Editor/AutoLayoutEditorWraper";
import { AutoLayoutViewerWrapper } from "./viewer/AutoLayoutViewerWrapper";

export const getAutoLayoutSystemWrapper = (renderMode: RenderModes) => {
  if (renderMode === RenderModes.CANVAS) {
    return AutoLayoutEditorWraper;
  } else {
    return AutoLayoutViewerWrapper;
  }
};
