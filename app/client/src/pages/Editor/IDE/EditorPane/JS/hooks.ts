import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createNewJSCollection } from "actions/jsPaneActions";
import { getCurrentPageId } from "selectors/editorSelectors";
import history from "utils/history";
import { LIST_PATH } from "@appsmith/constants/routes/appRoutes";

export const useJSAdd = () => {
  const pageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();
  const addButtonClickHandler = useCallback(() => {
    dispatch(createNewJSCollection(pageId, "JS_OBJECT_GUTTER_RUN_BUTTON"));
  }, [pageId]);
  return addButtonClickHandler;
};

export const useJSList = () => {
  const onListClickHandler = useCallback(() => {
    history.push(`${location.pathname}${LIST_PATH}`);
  }, []);
  return onListClickHandler;
};
