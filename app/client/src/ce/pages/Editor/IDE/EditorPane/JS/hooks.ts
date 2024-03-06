import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createNewJSCollection } from "actions/jsPaneActions";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { GroupedAddOperations } from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";
import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import { JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import type { UseRoutes } from "@appsmith/entities/IDE/constants";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import JSEditor from "pages/Editor/JSEditor";
import AddJS from "pages/Editor/IDE/EditorPane/JS/Add";
import { ADD_PATH } from "@appsmith/constants/routes/appRoutes";
import ListJS from "pages/Editor/IDE/EditorPane/JS/List";
import { BlankStateContainer } from "pages/Editor/IDE/EditorPane/JS/BlankStateContainer";

export const useJSAdd = () => {
  const pageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();
  return useCallback(() => {
    dispatch(createNewJSCollection(pageId, "ENTITY_EXPLORER"));
  }, [dispatch, pageId]);
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

export const useJSSegmentRoutes = (path: string): UseRoutes => {
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const editorMode = useSelector(getIDEViewMode);
  if (isSideBySideEnabled && editorMode === EditorViewMode.SplitScreen) {
    return [
      {
        exact: true,
        key: "AddJS",
        component: AddJS,
        path: [`${path}${ADD_PATH}`, `${path}/:collectionId${ADD_PATH}`],
      },
      {
        exact: true,
        key: "JSEditor",
        component: JSEditor,
        path: [path + "/:collectionId"],
      },
      {
        key: "JSEmpty",
        component: BlankStateContainer,
        exact: true,
        path: [path],
      },
    ];
  }
  return [
    {
      exact: true,
      key: "AddJS",
      component: AddJS,
      path: [`${path}${ADD_PATH}`, `${path}/:collectionId${ADD_PATH}`],
    },
    {
      exact: false,
      key: "ListJS",
      component: ListJS,
      path: [path],
    },
  ];
};
