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

export const useModuleOptions = () => {
  const allModules = useSelector(getAllModules);
  const modules = convertModulesToArray(allModules);

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
          creatorId: pageId,
          creatorType: ModuleInstanceCreatorType.PAGE,
          moduleId: module.id,
        }),
    };
  });

  return moduleOptions || [];
};
