import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getApiPaneConfigSelectedTabIndex } from "selectors/apiPaneSelectors";
import { API_EDITOR_TABS } from "constants/ApiEditorConstants/CommonApiConstants";
import { setApiPaneConfigSelectedTabIndex } from "actions/apiPaneActions";

export function useSelectedFormTab(): [string, (id: string) => void] {
  const dispatch = useDispatch();
  // the redux form has been configured with indexes, but the new ads components need strings to work.
  // these functions convert them back and forth as needed.
  const selectedIndex = useSelector(getApiPaneConfigSelectedTabIndex);
  const selectedValue = Object.values(API_EDITOR_TABS)[selectedIndex];
  const setSelectedIndex = useCallback(
    (value: string) => {
      const index = Object.values(API_EDITOR_TABS).indexOf(
        value as API_EDITOR_TABS,
      );
      dispatch(setApiPaneConfigSelectedTabIndex(index));
    },
    [dispatch],
  );

  return [selectedValue, setSelectedIndex];
}
