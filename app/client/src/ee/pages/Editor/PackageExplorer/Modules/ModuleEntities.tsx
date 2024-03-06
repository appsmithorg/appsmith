import React, { Fragment } from "react";

import { Icon } from "design-system";
import { ENTITY_EXPLORER_RENDER_ORDER } from "@appsmith/constants/ModuleConstants";
import ModuleEntity from "./Entity";
import {
  getAllModules,
  getCurrentModuleId,
} from "@appsmith/selectors/modulesSelector";
import { useSelector } from "react-redux";
import {
  EMPTY_MODULES_MSG,
  NEW_MODULE_BUTTON,
  createMessage,
} from "@appsmith/constants/messages";
import { AddEntity, EmptyComponent } from "pages/Editor/Explorer/common";
import { getModulesMetadata } from "@appsmith/selectors/packageSelectors";
import type { ExtendedModule } from "./utils";
import { groupModules } from "./utils";

interface ModuleEntitiesProps {
  canCreateModules: boolean;
  packageId: string;
  openCreateNewMenu: () => void;
}

function ModuleEntities({
  canCreateModules,
  openCreateNewMenu,
  packageId,
}: ModuleEntitiesProps) {
  const currentModuleId = useSelector(getCurrentModuleId);
  const modulesMetadata = useSelector(getModulesMetadata);
  const modules = useSelector(getAllModules);
  const { modulesCount, modulesMap } = groupModules({
    modules,
    modulesMetadata,
  });

  const renderModule = (module: ExtendedModule) => {
    return (
      <ModuleEntity
        currentModuleId={currentModuleId}
        key={module.id}
        module={module}
        packageId={packageId}
      />
    );
  };

  if (modulesCount === 0) {
    return (
      <EmptyComponent
        mainText={createMessage(EMPTY_MODULES_MSG)}
        {...(canCreateModules && {
          addBtnText: createMessage(NEW_MODULE_BUTTON),
          addFunction: openCreateNewMenu,
        })}
      />
    );
  }

  return (
    <>
      {ENTITY_EXPLORER_RENDER_ORDER.map((type) => {
        return modulesMap[type].map((m) => renderModule(m));
      })}

      {canCreateModules && (
        <AddEntity
          action={openCreateNewMenu}
          entityId={packageId}
          icon={<Icon name="plus" />}
          name={createMessage(NEW_MODULE_BUTTON)}
          step={1}
        />
      )}
    </>
  );
}

export default ModuleEntities;
