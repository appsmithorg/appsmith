import { useSelector } from "react-redux";
import { useLocation } from "react-router";

import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import { JS_COLLECTION_EDITOR_PATH } from "constants/routes";

/**
 * Hook to check if current component is in side-by-side editor mode.
 */
const useIsInSideBySideEditor = () => {
  const { pathname } = useLocation();
  const ideViewMode = useSelector(getIDEViewMode);

  const isInSideBySideEditor =
    ideViewMode === EditorViewMode.SplitScreen &&
    pathname.includes(JS_COLLECTION_EDITOR_PATH);

  return isInSideBySideEditor;
};

export default useIsInSideBySideEditor;
