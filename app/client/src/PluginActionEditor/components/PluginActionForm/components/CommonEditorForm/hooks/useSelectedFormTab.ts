import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getPluginActionConfigSelectedTab,
  setPluginActionEditorSelectedTab,
} from "PluginActionEditor/store";

export function useSelectedFormTab(): [
  string | undefined,
  (id: string) => void,
] {
  const dispatch = useDispatch();
  const selectedValue = useSelector(getPluginActionConfigSelectedTab);
  const setSelectedTab = useCallback(
    (value: string) => {
      dispatch(setPluginActionEditorSelectedTab(value));
    },
    [dispatch],
  );

  return [selectedValue, setSelectedTab];
}
