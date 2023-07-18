import { RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import type { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import { getRenderMode } from "selectors/editorSelectors";
import { useBaseWidgetEditor } from "./editor/useBaseWidgetEditor";
import { useBaseWidgetViewer } from "./viewer/useBaseWidgetViewer";

export const useBaseWidgetRender = (props: {
  appPositioningType: AppPositioningTypes;
}) => {
  let renderer = {};
  const renderMode = useSelector(getRenderMode);

  switch (renderMode) {
    case RenderModes.CANVAS:
      renderer = useBaseWidgetEditor(props);
      break;
    case RenderModes.PAGE:
      renderer = useBaseWidgetViewer();
      break;
  }

  return renderer;
};
