export * from "ce/utils/moduleInstanceHelpers";
import React from "react";
import { getAllModules } from "@appsmith/selectors/modulesSelector";
import { useSelector } from "react-redux";
import {
  convertModulesToArray,
  getModuleIdPackageNameMap,
} from "./Packages/moduleHelpers";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import { createQueryModuleInstance } from "@appsmith/actions/moduleInstanceActions";
import { EntityIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { Icon } from "design-system";
import { ModuleInstanceCreatorType } from "@appsmith/constants/ModuleInstanceConstants";
import type {
  ModuleInstance,
  ModuleInstanceId,
} from "@appsmith/constants/ModuleInstanceConstants";
import { getAllModuleInstances } from "@appsmith/selectors/moduleInstanceSelectors";
import { getNextEntityName } from "utils/AppsmithUtils";
import { getPackages } from "@appsmith/selectors/packageSelectors";
import { sortBy } from "lodash";

export const createNewModuleInstanceName = (
  moduleInstances: Record<ModuleInstanceId, ModuleInstance>,
  prefix: string,
) => {
  const names = Object.values(moduleInstances).map((q) => q.name);
  return getNextEntityName(`${prefix}_`, names);
};

export const useModuleOptions = () => {
  const allModules = useSelector(getAllModules);
  const modules = convertModulesToArray(allModules);
  const packages = useSelector(getPackages);
  const moduleInstances: Record<ModuleInstanceId, ModuleInstance> = useSelector(
    getAllModuleInstances,
  );
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
          name: createNewModuleInstanceName(moduleInstances, module.name),
          sourceModuleId: module.id,
        }),
      tooltip: `From ${modulePackageMap[module.id]} package`,
    };
  });

  return moduleOptions || [];
};
