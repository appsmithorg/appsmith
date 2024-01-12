import { useCallback } from "react";
import history from "utils/history";
import { LIST_PATH } from "@appsmith/constants/routes/appRoutes";
import { useLocation } from "react-router";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { useCurrentEditorState } from "../../hooks";
import { EditorEntityTabState } from "@appsmith/entities/IDE/constants";
import { queryAddURL, queryEditorIdURL } from "@appsmith/RouteBuilder";

export const useQueryAdd = () => {
  const location = useLocation();
  const currentEntityInfo = identifyEntityFromPath(location.pathname);
  const { segmentMode } = useCurrentEditorState();

  const addButtonClickHandler = useCallback(() => {
    let url = queryAddURL({});
    if (segmentMode === EditorEntityTabState.Edit) {
      url = queryEditorIdURL({ queryId: currentEntityInfo.id, add: true });
    }
    history.push(url);
  }, [location, currentEntityInfo]);

  return addButtonClickHandler;
};

export const useQueryList = () => {
  const listButtonClickHandler = useCallback(() => {
    history.push(`${location.pathname}${LIST_PATH}`);
  }, []);
  return listButtonClickHandler;
};
