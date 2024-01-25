export * from "ce/pages/Editor/IDE/EditorPane/Query/hooks";

import { useGroupedAddQueryOperations as CE_useGroupedAddQueryOperations } from "ce/pages/Editor/IDE/EditorPane/Query/hooks";
import type { GroupedAddOperations } from "ce/pages/Editor/IDE/EditorPane/Query/hooks";

import {
  apiEditorIdURL,
  queryAddURL,
  queryEditorIdURL,
} from "@appsmith/RouteBuilder";
import { useLocation } from "react-router";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { useCallback } from "react";
import { EditorEntityTabState } from "@appsmith/entities/IDE/constants";
import { moduleInstanceEditorURL } from "@appsmith/RouteBuilder";
import { useCurrentEditorState } from "pages/Editor/IDE/hooks";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import history from "utils/history";
import { groupBy } from "lodash";
import { useModuleOptions } from "@appsmith/utils/moduleInstanceHelpers";

export const useQueryAdd = () => {
  const location = useLocation();
  const currentEntityInfo = identifyEntityFromPath(location.pathname);
  const { segmentMode } = useCurrentEditorState();

  const addButtonClickHandler = useCallback(() => {
    let url = queryAddURL({});
    if (segmentMode === EditorEntityTabState.Edit) {
      switch (currentEntityInfo.entity) {
        case FocusEntity.QUERY:
          url = queryEditorIdURL({ queryId: currentEntityInfo.id, add: true });
          break;
        case FocusEntity.API:
          url = apiEditorIdURL({ apiId: currentEntityInfo.id, add: true });
          break;
        case FocusEntity.QUERY_MODULE_INSTANCE:
          url = moduleInstanceEditorURL({
            moduleInstanceId: currentEntityInfo.id,
            add: true,
            moduleType: MODULE_TYPE.QUERY,
          });
      }
    }
    history.push(url);
  }, [currentEntityInfo.id, location, segmentMode]);

  return addButtonClickHandler;
};

export const useGroupedAddQueryOperations = (): GroupedAddOperations => {
  const [fromSourceGroup, fromBlankGroup] = CE_useGroupedAddQueryOperations();
  const moduleOperations = useModuleOptions();
  const queryModules = moduleOperations.filter(
    (fileOperations) =>
      fileOperations.focusEntityType === FocusEntity.QUERY_MODULE_INSTANCE,
  );
  const packageQueryModuleGroups = groupBy(queryModules, "tooltip");
  const queryModulesGroups: GroupedAddOperations = [];
  Object.entries(packageQueryModuleGroups).forEach(
    ([packageTitle, instanceOps]) => {
      queryModulesGroups.push({
        title: packageTitle,
        className: `t--${packageTitle}`,
        operations: instanceOps,
      });
    },
  );

  // We still show the existing datasource group first, then add the module groups and finally the blanks group
  return [fromSourceGroup, ...queryModulesGroups, fromBlankGroup];
};
