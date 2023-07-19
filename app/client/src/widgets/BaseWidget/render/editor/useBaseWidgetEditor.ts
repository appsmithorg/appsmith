import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { RenderMode, RenderModes } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import { getRenderMode } from "selectors/editorSelectors";
import { useBaseWidgetAutoLayoutEditor } from "./autoLayout/useBaseWidgetAutoLayoutEditor";
import { useBaseWidgetFixedLayoutEditor } from "./fixed/useBaseWidgetFixedLayoutEditor";

export const useBaseWidgetEditor = (props: {
  appPositioningType?: AppPositioningTypes;
  type: string;
  deferRender: boolean;
  isFlexChild: boolean;
  detachFromLayout: boolean;
  resizeDisabled: boolean;
}) => {
  let editor = {};
  switch (props.appPositioningType) {
    case AppPositioningTypes.AUTO:
      editor = useBaseWidgetAutoLayoutEditor(props);
      break;
    default:
      editor = useBaseWidgetFixedLayoutEditor();
      break;
  }
  return editor;
};
