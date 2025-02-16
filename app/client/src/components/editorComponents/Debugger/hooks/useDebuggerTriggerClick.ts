import { useDispatch, useSelector } from "react-redux";
import { DEBUGGER_TAB_KEYS } from "../constants";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useDebuggerConfig } from "./useDebuggerConfig";

const useDebuggerTriggerClick = () => {
  const dispatch = useDispatch();
  const config = useDebuggerConfig();

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
