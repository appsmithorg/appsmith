import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { API_EDITOR_TABS } from "constants/ApiEditorConstants/CommonApiConstants";
import {
  getPluginActionConfigSelectedTabIndex,
  setPluginActionEditorSelectedTab,
} from "PluginActionEditor";

export function useSelectedFormTab(): [string, (id: string) => void] {
  const dispatch = useDispatch();
  // the redux form has been configured with indexes, but the new ads components need strings to work.
  // these functions convert them back and forth as needed.
  const selectedIndex = useSelector(getPluginActionConfigSelectedTabIndex) || 0;
  const selectedValue = Object.values(API_EDITOR_TABS)[selectedIndex];
  const setSelectedIndex = useCallback(
    (value: string) => {
      const index = Object.values(API_EDITOR_TABS).indexOf(
        value as API_EDITOR_TABS,
      );

      dispatch(setPluginActionEditorSelectedTab(index));
    },
    [dispatch],
  );

  return [selectedValue, setSelectedIndex];
}
