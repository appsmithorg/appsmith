import { useSelector } from "react-redux";
import { useLocation } from "react-router";

import { getIDEViewMode } from "selectors/ideSelectors";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { isInSideBySideEditor } from "../utils/isInSideBySideEditor";
import { getCurrentEntityInfo } from "../utils/getCurrentEntityInfo";

/**
 * Checks if current component is in side-by-side editor mode.
 */
export const useIsInSideBySideEditor = () => {
  const { pathname } = useLocation();
  const viewMode = useSelector(getIDEViewMode);
  const { appState, entity } = identifyEntityFromPath(pathname);
  const { segment } = getCurrentEntityInfo(entity);

  return isInSideBySideEditor({ appState, segment, viewMode });
};
