import { RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { getRenderMode } from "selectors/editorSelectors";
import { withAutoLayoutEditor } from "./Editor/withAutoLayoutEditor";
import { withAutoLayoutViewer } from "./Viewer/withAutoLayoutViewer";

export const useAutoLayoutSystem = () => {
  const renderMode = useSelector(getRenderMode);
  if (renderMode === RenderModes.CANVAS) {
    return withAutoLayoutEditor;
  } else {
    return withAutoLayoutViewer;
  }
};
