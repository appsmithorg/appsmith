import { useDispatch, useSelector } from "react-redux";
import type { GenericEntityItem } from "ee/entities/IDE/constants";
import { setDebuggerStateInspectorSelectedItem } from "actions/debuggerActions";
import { getDebuggerStateInspectorSelectedItem } from "selectors/debuggerSelectors";

export const useStateInspectorState: () => [
  GenericEntityItem | undefined,
  (item: GenericEntityItem) => void,
] = () => {
  const dispatch = useDispatch();

  const setSelectedItem = (item: GenericEntityItem) => {
    dispatch(setDebuggerStateInspectorSelectedItem(item));
  };

  const selectedItem = useSelector(getDebuggerStateInspectorSelectedItem);

  return [selectedItem, setSelectedItem];
};
