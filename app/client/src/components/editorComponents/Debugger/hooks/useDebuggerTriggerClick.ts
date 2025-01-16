import { useLocation } from "react-router";
import { DEBUGGER_TAB_KEYS } from "../constants";
import { setCanvasDebuggerState } from "actions/debuggerActions";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { setJsPaneDebuggerState } from "actions/jsPaneActions";
import { getJsPaneDebuggerState } from "selectors/jsPaneSelectors";
import {
  getPluginActionDebuggerState,
  setPluginActionEditorDebuggerState,
} from "PluginActionEditor/store";
import { getCanvasDebuggerState } from "selectors/debuggerSelectors";
import { getIDEViewMode } from "selectors/ideSelectors";
import { useDispatch, useSelector } from "react-redux";
// Using global type definitions for AppState, EditorViewMode, ReduxAction

// No-op analytics to avoid EE dependency
const logDebuggerEvent = () => {
  // No-op to avoid EE dependency
};

// Common type for all debugger states
type CommonDebuggerState = {
  selectedTab?: string;
  open?: boolean;
};

interface Config {
  set: (
    payload: Partial<CommonDebuggerState>,
  ) => ReduxAction<Partial<CommonDebuggerState>>;
  get: (state: AppState) => CommonDebuggerState;
}

const canvasDebuggerConfig: Config = {
  set: setCanvasDebuggerState,
  get: (state: AppState) => getCanvasDebuggerState(state) as unknown as CommonDebuggerState,
};

const pluginActionEditorDebuggerConfig: Config = {
  set: setPluginActionEditorDebuggerState,
  get: (state: AppState) => getPluginActionDebuggerState(state) as unknown as CommonDebuggerState,
};

export const getDebuggerPaneConfig = (
  focusInfo: FocusEntityInfo,
  ideViewMode: EditorViewMode,
): Config => {
  if (ideViewMode === "SplitScreen") {
    return canvasDebuggerConfig;
  }

  switch (focusInfo.entity) {
    case FocusEntity.QUERY:
      return pluginActionEditorDebuggerConfig;
    case FocusEntity.JS_OBJECT:
      return {
        set: setJsPaneDebuggerState,
        get: (state: AppState) => getJsPaneDebuggerState(state) as unknown as CommonDebuggerState,
      };
    default:
      return canvasDebuggerConfig;
  }
};

const useDebuggerTriggerClick = () => {
  const location = useLocation();
  const currentFocus = identifyEntityFromPath(location.pathname);
  const ideState = useSelector(getIDEViewMode) as EditorViewMode;
  const dispatch = useDispatch();

  const config = getDebuggerPaneConfig(currentFocus, ideState);

  const state = useSelector(config.get);

  return () => {
    // If debugger is already open and selected tab is error tab then we will close debugger.
    if (state.open && state.selectedTab === DEBUGGER_TAB_KEYS.ERROR_TAB) {
      dispatch(config.set({ open: false }));
    } else {
      // If debugger is not open then we will open debugger and show error tab.
      if (!state.open) {
        dispatch(
          config.set({ open: true, selectedTab: DEBUGGER_TAB_KEYS.ERROR_TAB }),
        );
      }

      // Select error tab if debugger is open and selected tab is not error tab.
      // And also when we are opening debugger.
      dispatch(config.set({ selectedTab: DEBUGGER_TAB_KEYS.ERROR_TAB }));
    }

    if (!state.open) {
      logDebuggerEvent();
    }
  };
};

export default useDebuggerTriggerClick;
