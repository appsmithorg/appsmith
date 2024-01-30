export * from "ce/utils/moduleInstanceHelpers";
import React from "react";
import { getAllModules } from "@appsmith/selectors/modulesSelector";
import { useSelector } from "react-redux";
import {
  convertModulesToArray,
  getModuleIdPackageNameMap,
} from "./Packages/moduleHelpers";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import { createQueryModuleInstance } from "@appsmith/actions/moduleInstanceActions";
import { EntityIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { Icon } from "design-system";
import { ModuleInstanceCreatorType } from "@appsmith/constants/ModuleInstanceConstants";
import { getPackages } from "@appsmith/selectors/packageSelectors";
import { sortBy } from "lodash";
import { FocusEntity } from "navigation/FocusEntity";

export const useModuleOptions = (): ActionOperation[] => {
  const allModules = useSelector(getAllModules);
  const modules = convertModulesToArray(allModules);
  const packages = useSelector(getPackages);
  const modulePackageMap = getModuleIdPackageNameMap(modules, packages);
  const sortedModules = sortBy(modules, (module) => module.name.toUpperCase());

  const moduleOptions = sortedModules.map((module) => {
    return {
      title: `Add ${module.name}`,
      desc: `Create a ${module.name} instance`,
      icon: (
        <EntityIcon>
          <Icon name="module" />
        </EntityIcon>
      ),
      kind: SEARCH_ITEM_TYPES.actionOperation,
      action: (pageId: string) =>
        createQueryModuleInstance({
          contextId: pageId,
          contextType: ModuleInstanceCreatorType.PAGE,
          sourceModuleId: module.id,
        }),
      tooltip: `From ${modulePackageMap[module.id]} package`,
      focusEntityType:
        module.type === MODULE_TYPE.QUERY
          ? FocusEntity.QUERY_MODULE_INSTANCE
          : FocusEntity.JS_MODULE_INSTANCE,
    };
  });

  return moduleOptions || [];
};
