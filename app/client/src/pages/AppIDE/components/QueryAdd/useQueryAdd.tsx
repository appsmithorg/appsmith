import { useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { getIDEViewMode } from "selectors/ideSelectors";
import { useCallback } from "react";
import { EditorViewMode } from "IDE/Interfaces/EditorTypes";
import { setListViewActiveState } from "actions/ideActions";
import { getQueryUrl } from "ee/pages/AppIDE/components/QueryAdd/getQueryUrl";
import history from "utils/history";

export const useQueryAdd = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const currentEntityInfo = identifyEntityFromPath(location.pathname);
  const ideViewMode = useSelector(getIDEViewMode);

  const openAddQuery = useCallback(() => {
    if (currentEntityInfo.entity === FocusEntity.QUERY_ADD) {
      if (ideViewMode === EditorViewMode.SplitScreen) {
        dispatch(setListViewActiveState(false));
      }

      return;
    }

    const url = getQueryUrl(currentEntityInfo);

    history.push(url);
  }, [currentEntityInfo, dispatch, ideViewMode]);

  const closeAddQuery = useCallback(() => {
    const url = getQueryUrl(currentEntityInfo, false);

    history.push(url);
  }, [currentEntityInfo]);

  return { openAddQuery, closeAddQuery };
};
