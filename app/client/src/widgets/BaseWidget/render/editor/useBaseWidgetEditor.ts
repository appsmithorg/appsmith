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
}): {
  appsmithWidgetRender: (content: any) => any;
} => {
  if (props.appPositioningType === AppPositioningTypes.AUTO) {
    return useBaseWidgetAutoLayoutEditor(props);
  } else {
    return useBaseWidgetFixedLayoutEditor();
  }
};
