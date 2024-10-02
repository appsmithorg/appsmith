import { useLocation } from "react-router";
import { DEBUGGER_TAB_KEYS } from "../helpers";
import { setCanvasDebuggerState } from "actions/debuggerActions";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { setJsPaneDebuggerState } from "actions/jsPaneActions";
import { getJsPaneDebuggerState } from "selectors/jsPaneSelectors";
import {
  getPluginActionDebuggerState,
  setPluginActionEditorDebuggerState,
} from "PluginActionEditor";
import { getCanvasDebuggerState } from "selectors/debuggerSelectors";
import { getIDEViewMode } from "selectors/ideSelectors";
import { useDispatch, useSelector } from "react-redux";
import { EditorViewMode } from "ee/entities/IDE/constants";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import type { CanvasDebuggerState } from "reducers/uiReducers/debuggerReducer";
import type { AppState } from "ee/reducers";

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

const getConfig = (focusInfo: FocusEntityInfo): Config => {
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

const useDebuggerTriggerClick = () => {
  const location = useLocation();
  const currentFocus = identifyEntityFromPath(location.pathname);
  const ideState = useSelector(getIDEViewMode);
  const dispatch = useDispatch();

  const config =
    ideState === EditorViewMode.FullScreen
      ? getConfig(currentFocus)
      : canvasDebuggerConfig;

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
      AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
        source: "TRIGGER",
      });
    }
  };
};

export default useDebuggerTriggerClick;
