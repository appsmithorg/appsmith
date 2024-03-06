export * from "ce/pages/Editor/IDE/EditorPane/JS/hooks";

import {
  useGroupedAddJsOperations as CE_useGroupedAddJsOperations,
  useJSSegmentRoutes as CE_useJSSegmentRoutes,
} from "ce/pages/Editor/IDE/EditorPane/JS/hooks";

import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import { jsCollectionAddURL, jsCollectionIdURL } from "@appsmith/RouteBuilder";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { createNewJSCollection } from "actions/jsPaneActions";
import { moduleInstanceEditorURL } from "@appsmith/RouteBuilder";
import { useLocation } from "react-router";
import { useCallback } from "react";
import {
  EditorEntityTabState,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { useCurrentEditorState } from "pages/Editor/IDE/hooks";
import { useModuleOptions } from "@appsmith/utils/moduleInstanceHelpers";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import history from "utils/history";
import { groupBy } from "lodash";
import type { GroupedAddOperations } from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";
import type { UseRoutes } from "@appsmith/entities/IDE/constants";
import ModuleInstanceEditor from "@appsmith/pages/Editor/ModuleInstanceEditor";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "@appsmith/constants/routes/appRoutes";
import { MODULE_INSTANCE_ID_PATH } from "@appsmith/constants/routes/appRoutes";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";

/**
 * Updating to add checks of module instance operations;
 * if there are JS modules, we want to show a list of options the
 * user can add. Or else there is just one blank js option so just create it
 * **/
export const useJSAdd = () => {
  const pageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();
  const moduleCreationOptions = useModuleOptions();
  const jsModuleCreationOptions = moduleCreationOptions.filter(
    (opt) => opt.focusEntityType === FocusEntity.JS_MODULE_INSTANCE,
  );
  const location = useLocation();
  const currentEntityInfo = identifyEntityFromPath(location.pathname);
  const { segmentMode } = useCurrentEditorState();
  return useCallback(() => {
    if (jsModuleCreationOptions.length === 0) {
      dispatch(createNewJSCollection(pageId, "ENTITY_EXPLORER"));
      return;
    }
    let url = jsCollectionAddURL({ pageId });
    if (segmentMode === EditorEntityTabState.Edit) {
      switch (currentEntityInfo.entity) {
        case FocusEntity.JS_OBJECT:
          url = jsCollectionIdURL({
            collectionId: currentEntityInfo.id,
            add: true,
          });
          break;
        case FocusEntity.JS_MODULE_INSTANCE:
          url = moduleInstanceEditorURL({
            moduleInstanceId: currentEntityInfo.id,
            add: true,
            moduleType: MODULE_TYPE.JS,
          });
      }
    }
    history.push(url);
  }, [jsModuleCreationOptions, currentEntityInfo.id, segmentMode, pageId]);
};

/**
 * Updating to add JS module options in the list of Add JS Operations.
 * **/
export const useGroupedAddJsOperations = (): GroupedAddOperations => {
  const ce_jsOperations = CE_useGroupedAddJsOperations();
  const moduleCreationOptions = useModuleOptions();
  const jsModuleCreationOptions = moduleCreationOptions.filter(
    (opt) => opt.focusEntityType === FocusEntity.JS_MODULE_INSTANCE,
  );
  const packageJSModuleGroups = groupBy(jsModuleCreationOptions, "tooltip");
  const jsOperations = [...ce_jsOperations];
  Object.entries(packageJSModuleGroups).forEach(([packageTitle, modules]) => {
    jsOperations.push({
      title: packageTitle,
      className: `t--${packageTitle}`,
      operations: modules,
    });
  });

  return jsOperations;
};

export const useJSSegmentRoutes = (path: string): UseRoutes => {
  const ceRoutes = CE_useJSSegmentRoutes(path);
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const editorMode = useSelector(getIDEViewMode);
  if (isSideBySideEnabled && editorMode === EditorViewMode.SplitScreen) {
    return [
      {
        key: "ModuleInstanceEditor",
        component: ModuleInstanceEditor,
        exact: true,
        path: [
          BUILDER_PATH + MODULE_INSTANCE_ID_PATH,
          BUILDER_CUSTOM_PATH + MODULE_INSTANCE_ID_PATH,
          BUILDER_PATH_DEPRECATED + MODULE_INSTANCE_ID_PATH,
        ],
      },
      ...ceRoutes,
    ];
  }
  return ceRoutes;
};
