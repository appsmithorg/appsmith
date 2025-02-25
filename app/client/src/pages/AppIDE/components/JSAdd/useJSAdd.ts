import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { useModuleOptions } from "ee/utils/moduleInstanceHelpers";
import { getIDEViewMode } from "selectors/ideSelectors";
import { useCallback } from "react";
import { createNewJSCollection } from "actions/jsPaneActions";
import { EditorViewMode } from "IDE/Interfaces/EditorTypes";
import { setListViewActiveState } from "actions/ideActions";
import { getJSUrl } from "ee/pages/AppIDE/components/JSAdd/getJSUrl";
import history from "utils/history";

export const useJSAdd = () => {
  const pageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();
  const currentEntityInfo = identifyEntityFromPath(location.pathname);
  const moduleCreationOptions = useModuleOptions();
  const jsModuleCreationOptions = moduleCreationOptions.filter(
    (opt) => opt.focusEntityType === FocusEntity.JS_MODULE_INSTANCE,
  );
  const ideViewMode = useSelector(getIDEViewMode);

  const openAddJS = useCallback(() => {
    if (jsModuleCreationOptions.length === 0) {
      dispatch(createNewJSCollection(pageId, "ENTITY_EXPLORER"));
    } else {
      if (currentEntityInfo.entity === FocusEntity.JS_OBJECT_ADD) {
        if (ideViewMode === EditorViewMode.SplitScreen) {
          dispatch(setListViewActiveState(false));
        }

        return;
      }

      const url = getJSUrl(currentEntityInfo, true);

      history.push(url);
    }
  }, [
    jsModuleCreationOptions,
    pageId,
    dispatch,
    currentEntityInfo,
    ideViewMode,
  ]);

  const closeAddJS = useCallback(() => {
    const url = getJSUrl(currentEntityInfo, false);

    history.push(url);
  }, [currentEntityInfo]);

  return { openAddJS, closeAddJS };
};
