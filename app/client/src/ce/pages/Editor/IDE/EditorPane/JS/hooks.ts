import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createNewJSCollection } from "actions/jsPaneActions";
import { getCurrentPageId } from "selectors/editorSelectors";
import history from "utils/history";
import { LIST_PATH } from "@appsmith/constants/routes/appRoutes";
import { useLocation } from "react-router";
import type { GroupedAddOperations } from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";
import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import { JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";

export const useJSAdd = () => {
  const pageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();
  return useCallback(() => {
    dispatch(createNewJSCollection(pageId, "ENTITY_EXPLORER"));
  }, [dispatch]);
};

export const useJSList = () => {
  const location = useLocation();
  const onListClickHandler = useCallback(() => {
    history.push(`${location.pathname}${LIST_PATH}`);
  }, []);
  return onListClickHandler;
};

export const useGroupedAddJsOperations = (): GroupedAddOperations => {
  return [
    {
      className: "t--blank-js",
      operations: [
        {
          title: createMessage(EDITOR_PANE_TEXTS.js_blank_object_item),
          desc: "",
          icon: JsFileIconV2(16, 16),
          kind: SEARCH_ITEM_TYPES.actionOperation,
          action: (pageId) => createNewJSCollection(pageId, "ENTITY_EXPLORER"),
        },
      ],
    },
  ];
};
