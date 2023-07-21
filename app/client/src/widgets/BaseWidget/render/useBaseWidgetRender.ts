import { RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import type { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import { getRenderMode } from "selectors/editorSelectors";
import { useBaseWidgetEditor } from "./editor/useBaseWidgetEditor";
import { useBaseWidgetViewer } from "./viewer/useBaseWidgetViewer";

export const useBaseWidgetRender = (props: {
  appPositioningType?: AppPositioningTypes;
  type: string;
  deferRender: boolean;
  isFlexChild: boolean;
  detachFromLayout: boolean;
  resizeDisabled: boolean;
}): {
  appsmithWidgetRender: (content: any) => any;
} => {
  const renderMode = useSelector(getRenderMode);
  if (renderMode === RenderModes.CANVAS) {
    return useBaseWidgetEditor(props);
  } else {
    return useBaseWidgetViewer();
  }
};
