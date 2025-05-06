import {
  getPluginActionDebuggerState,
  setPluginActionEditorDebuggerState,
} from "PluginActionEditor/store";
import { FocusEntity, type FocusEntityInfo } from "navigation/FocusEntity";
import { EditorViewMode } from "IDE/Interfaces/EditorTypes";
import { setJsPaneDebuggerState } from "actions/jsPaneActions";
import { getJsPaneDebuggerState } from "selectors/jsPaneSelectors";
import type { CanvasDebuggerState } from "reducers/uiReducers/debuggerReducer";
import type { ReduxAction } from "actions/ReduxActionTypes";
import type { DefaultRootState } from "react-redux";
import { setCanvasDebuggerState } from "actions/debuggerActions";
import { getCanvasDebuggerState } from "selectors/debuggerSelectors";

interface Config {
  set: (
    payload: Partial<CanvasDebuggerState>,
  ) => ReduxAction<Partial<CanvasDebuggerState>>;
  get: (state: DefaultRootState) => CanvasDebuggerState;
}

const canvasDebuggerConfig: Config = {
  set: setCanvasDebuggerState,
  get: getCanvasDebuggerState,
};
const pluginActionEditorDebuggerConfig: Config = {
  set: setPluginActionEditorDebuggerState,
  get: getPluginActionDebuggerState,
};

export const getDebuggerPaneConfig = (
  focusInfo: FocusEntityInfo,
  ideViewMode: EditorViewMode,
): Config => {
  if (ideViewMode === EditorViewMode.SplitScreen) {
    return canvasDebuggerConfig;
  }

  switch (focusInfo.entity) {
    case FocusEntity.QUERY:
      return pluginActionEditorDebuggerConfig;
    case FocusEntity.JS_OBJECT:
      return {
        set: setJsPaneDebuggerState,
        get: getJsPaneDebuggerState,
      };
    default:
      return canvasDebuggerConfig;
  }
};
