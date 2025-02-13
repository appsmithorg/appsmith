import { useMemo } from "react";
import { useLocation } from "react-router";
import {
  FocusEntity,
  type FocusEntityInfo,
  identifyEntityFromPath,
} from "navigation/FocusEntity";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { setCanvasDebuggerState } from "actions/debuggerActions";
import { getCanvasDebuggerState } from "selectors/debuggerSelectors";
import {
  getPluginActionDebuggerState,
  setPluginActionEditorDebuggerState,
} from "PluginActionEditor/store";
import type { CanvasDebuggerState } from "reducers/uiReducers/debuggerReducer";
import type { ReduxAction } from "actions/ReduxActionTypes";
import type { AppState } from "ee/reducers";
import { EditorViewMode } from "IDE/Interfaces/EditorTypes";
import { setJsPaneDebuggerState } from "actions/jsPaneActions";
import { getJsPaneDebuggerState } from "selectors/jsPaneSelectors";

interface Config {
  set: (
    payload: Partial<CanvasDebuggerState>,
  ) => ReduxAction<Partial<CanvasDebuggerState>>;
  get: (state: AppState) => CanvasDebuggerState;
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

export const useDebuggerConfig = () => {
  const location = useLocation();
  const currentFocus = identifyEntityFromPath(location.pathname);
  const ideState = useSelector(getIDEViewMode);

  return useMemo(
    () => getDebuggerPaneConfig(currentFocus, ideState),
    [currentFocus, ideState],
  );
};
