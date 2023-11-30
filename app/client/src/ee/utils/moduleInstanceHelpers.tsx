export * from "ce/utils/moduleInstanceHelpers";
import React from "react";
import { getAllModules } from "@appsmith/selectors/modulesSelector";
import { useSelector } from "react-redux";
import { convertModulesToArray } from "./Packages/moduleHelpers";
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
import { MODULE_PREFIX } from "@appsmith/constants/ModuleConstants";

export const createNewModuleInstanceName = (
  moduleInstances: Record<ModuleInstanceId, ModuleInstance>,
  prefix: MODULE_PREFIX,
) => {
  const names = Object.values(moduleInstances).map((q) => q.name);
  return getNextEntityName(`${prefix}ModuleInstance`, names);
};

export const useModuleOptions = () => {
  const allModules = useSelector(getAllModules);
  const modules = convertModulesToArray(allModules);
  const moduleInstances: Record<ModuleInstanceId, ModuleInstance> = useSelector(
    getAllModuleInstances,
  );

  const moduleOptions = modules.map((module) => {
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
          name: createNewModuleInstanceName(
            moduleInstances,
            MODULE_PREFIX.QUERY,
          ),
          sourceModuleId: module.id,
        }),
    };
  });

  return moduleOptions || [];
};
