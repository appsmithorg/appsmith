export * from "ce/pages/Editor/IDE/EditorPane/Query/hooks";

import {
  useGroupedAddQueryOperations as CE_useGroupedAddQueryOperations,
  useQuerySegmentRoutes as CE_useQuerySegmentRoutes,
} from "ce/pages/Editor/IDE/EditorPane/Query/hooks";
import type { GroupedAddOperations } from "ce/pages/Editor/IDE/EditorPane/Query/hooks";

import { FocusEntity } from "navigation/FocusEntity";
import { groupBy } from "lodash";
import { useModuleOptions } from "@appsmith/utils/moduleInstanceHelpers";
import { useSelector } from "react-redux";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import ModuleInstanceEditor from "@appsmith/pages/Editor/ModuleInstanceEditor";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "@appsmith/constants/routes/appRoutes";
import { MODULE_INSTANCE_ID_PATH } from "@appsmith/constants/routes/appRoutes";
import type { UseRoutes } from "@appsmith/entities/IDE/constants";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";

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

export const useQuerySegmentRoutes = (path: string): UseRoutes => {
  const ceRoutes = CE_useQuerySegmentRoutes(path);
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
