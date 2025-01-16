import { useSelector } from "react-redux";
import { useLocation } from "react-router";
// Using global type definition for EditorViewMode
import { getIDEViewMode } from "../../selectors/ideSelectors";
import { identifyEntityFromPath } from "../../navigation/FocusEntity";
import {
  getCurrentEntityInfo,
  isInSideBySideEditor,
} from "../../pages/Editor/utils";

/**
 * Checks if current component is in side-by-side editor mode.
 */
export const useIsInSideBySideEditor = () => {
  const { pathname } = useLocation();
  const viewMode = useSelector(getIDEViewMode) as EditorViewMode;
  const { appState, entity } = identifyEntityFromPath(pathname);
  const { segment } = getCurrentEntityInfo(entity);

  return isInSideBySideEditor({ appState, segment, viewMode });
};
