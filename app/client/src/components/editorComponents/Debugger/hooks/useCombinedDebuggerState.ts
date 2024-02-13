import { useEffect, useState } from "react";
import type { AppState } from "@appsmith/reducers";
import { useDispatch, useSelector } from "react-redux";
import {
  getDebuggerOpen,
  getDebuggerSelectedTab,
} from "selectors/debuggerSelectors";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";

interface LocalDebuggerState {
  open: boolean;
  selectedTab?: string;
  responseTabHeight: number;
}

export const useCombinedDebuggerState = (
  stateSelector: (state: AppState) => LocalDebuggerState,
  stateSetter: (
    state: Partial<LocalDebuggerState>,
  ) => ReduxAction<Partial<LocalDebuggerState>>,
) => {
  const dispatch = useDispatch();
  const localState = useSelector(stateSelector);
  const debuggerOpenState = useSelector(getDebuggerOpen);
  const debuggerSelectedTab = useSelector(getDebuggerSelectedTab);
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const ideViewMode = useSelector(getIDEViewMode);

  const [combinedState, setCombinedState] =
    useState<LocalDebuggerState>(localState);

  // Always update the combined state with local changes
  useEffect(() => {
    setCombinedState(localState);
  }, [localState.selectedTab, localState.open]);

  // when preview mode is set, force close the debugger;
  useEffect(() => {
    if (isPreviewMode) {
      dispatch(
        stateSetter({
          ...combinedState,
          open: false,
        }),
      );
    }
  }, [isPreviewMode]);

  // when ide is split screen, reset to the local state;
  useEffect(() => {
    if (ideViewMode === EditorViewMode.SplitScreen) {
      setCombinedState(localState);
    }
  }, [ideViewMode, localState]);

  // When in full screen mode, look for changes in debugger state;
  useEffect(() => {
    if (ideViewMode === EditorViewMode.FullScreen) {
      dispatch(
        stateSetter({
          ...combinedState,
          open: debuggerOpenState,
          selectedTab: debuggerSelectedTab,
        }),
      );
    }
  }, [ideViewMode, debuggerOpenState, debuggerSelectedTab]);

  return combinedState;
};
