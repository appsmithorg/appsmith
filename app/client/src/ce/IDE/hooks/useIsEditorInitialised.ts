import { useSelector } from "react-redux";
import { getIsEditorInitialized } from "selectors/editorSelectors";

function useIsEditorInitialised() {
  return useSelector(getIsEditorInitialized);
}

export { useIsEditorInitialised };
