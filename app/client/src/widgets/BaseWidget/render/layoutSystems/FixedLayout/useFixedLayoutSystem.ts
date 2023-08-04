import { RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { getRenderMode } from "selectors/editorSelectors";
import { withFixedLayoutEditor } from "./Editor/withFixedLayoutEditor";
import { withFixedLayoutViewer } from "./Viewer/withFixedLayoutViewer";

export const useFixedLayoutSystem = () => {
  const renderMode = useSelector(getRenderMode);
  if (renderMode === RenderModes.CANVAS) {
    return withFixedLayoutEditor;
  } else {
    return withFixedLayoutViewer;
  }
};
