export * from "ce/pages/Editor/IDE/EditorPane/Query/hooks";

import { useGroupedAddQueryOperations as CE_useGroupedAddQueryOperations } from "ce/pages/Editor/IDE/EditorPane/Query/hooks";
import type { GroupedAddOperations } from "ce/pages/Editor/IDE/EditorPane/Query/hooks";

import { FocusEntity } from "navigation/FocusEntity";
import { groupBy } from "lodash";
import { useModuleOptions } from "@appsmith/utils/moduleInstanceHelpers";

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
