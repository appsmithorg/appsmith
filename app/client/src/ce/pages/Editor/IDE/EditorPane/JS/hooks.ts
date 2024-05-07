import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createNewJSCollection } from "actions/jsPaneActions";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { GroupedAddOperations } from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";
import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import { JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import type { UseRoutes } from "@appsmith/entities/IDE/constants";
import {
  EditorEntityTabState,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import JSEditor from "pages/Editor/JSEditor";
import AddJS from "pages/Editor/IDE/EditorPane/JS/Add";
import { ADD_PATH } from "@appsmith/constants/routes/appRoutes";
import ListJS from "pages/Editor/IDE/EditorPane/JS/List";
import { useCurrentEditorState } from "pages/Editor/IDE/hooks";
import history from "utils/history";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { useModuleOptions } from "@appsmith/utils/moduleInstanceHelpers";
import { getJSUrl } from "@appsmith/pages/Editor/IDE/EditorPane/JS/utils";

export const useJSAdd = () => {
  const pageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();
  const currentEntityInfo = identifyEntityFromPath(location.pathname);
  const { segmentMode } = useCurrentEditorState();
  const moduleCreationOptions = useModuleOptions();
  const jsModuleCreationOptions = moduleCreationOptions.filter(
    (opt) => opt.focusEntityType === FocusEntity.JS_MODULE_INSTANCE,
  );

  return useCallback(() => {
    if (jsModuleCreationOptions.length === 0) {
      if (segmentMode === EditorEntityTabState.Add) {
        const url = getJSUrl(currentEntityInfo, false);
        history.push(url);
      } else {
        dispatch(createNewJSCollection(pageId, "ENTITY_EXPLORER"));
      }
    } else {
      const url = getJSUrl(
        currentEntityInfo,
        !(segmentMode === EditorEntityTabState.Add),
      );
      history.push(url);
    }
  }, [
    dispatch,
    pageId,
    segmentMode,
    currentEntityInfo,
    jsModuleCreationOptions,
  ]);
};

export const useIsJSAddLoading = () => {
  const moduleCreationOptions = useModuleOptions();
  const jsModuleCreationOptions = moduleCreationOptions.filter(
    (opt) => opt.focusEntityType === FocusEntity.JS_MODULE_INSTANCE,
  );
  const { isCreating } = useSelector((state) => state.ui.jsPane);
  if (jsModuleCreationOptions.length === 0) {
    return isCreating;
  }
  return false;
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
        component: ListJS,
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
