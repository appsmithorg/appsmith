import { useDispatch, useSelector } from "react-redux";
import { setDebuggerStateInspectorSelectedItem } from "actions/debuggerActions";
import { getDebuggerStateInspectorSelectedItem } from "selectors/debuggerSelectors";

export const useStateInspectorState: () => [
  string | undefined,
  (itemId: string) => void,
] = () => {
  const dispatch = useDispatch();

  const setSelectedItem = (itemId: string) => {
    dispatch(setDebuggerStateInspectorSelectedItem(itemId));
  };

  const selectedItem = useSelector(getDebuggerStateInspectorSelectedItem);

  return [selectedItem, setSelectedItem];
};
