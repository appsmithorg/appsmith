import React, { useCallback, useEffect, useRef, useState } from "react";
import { EntityExplorerResizeHandler } from "pages/Editor/Explorer/Common/EntityExplorerResizeHandler";
import {
  getCurrentPackage,
  getCurrentPackageId,
} from "@appsmith/selectors/packageSelectors";
import { useSelector } from "react-redux";
import {
  RelativeContainer,
  StyledEntity,
} from "pages/Editor/Explorer/Common/components";
import { getExplorerStatus, saveExplorerStatus } from "../../Explorer/helpers";
import {
  ADD_MODULE_TOOLTIP,
  MODULES_TITLE,
  createMessage,
} from "@appsmith/constants/messages";
import { hasCreateModulePermission } from "@appsmith/utils/permissionHelpers";
import EntityAddButton from "pages/Editor/Explorer/Entity/AddButton";
import CreateNewModuleMenu from "./CreateNewModuleMenu";
import ModuleEntities from "./ModuleEntities";

const Modules = () => {
  const packageId = useSelector(getCurrentPackageId) || "";
  const isModulesOpen = getExplorerStatus(packageId, "packages");
  const moduleResizeRef = useRef<HTMLDivElement>(null);
  const storedHeightKey = "modulesContainerHeight_" + packageId;
  const storedHeight = localStorage.getItem(storedHeightKey);
  const userPackagePermissions =
    useSelector(getCurrentPackage)?.userPermissions ?? [];
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onModuleToggle = useCallback((isOpen: boolean) => {
    saveExplorerStatus(packageId, "packages", isOpen);
  }, []);

  useEffect(() => {
    if (
      (isModulesOpen === null ? true : isModulesOpen) &&
      moduleResizeRef.current
    ) {
      moduleResizeRef.current.style.height = storedHeight + "px";
    }
  }, [moduleResizeRef]);

  const canCreateModules = hasCreateModulePermission(userPackagePermissions);

  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <RelativeContainer className="border-b pb-1">
      <StyledEntity
        addButtonHelptext={createMessage(ADD_MODULE_TOOLTIP)}
        alwaysShowRightIcon
        className="pb-0 group pages"
        collapseRef={moduleResizeRef}
        customAddButton={
          <CreateNewModuleMenu
            canCreate={canCreateModules}
            closeMenu={closeMenu}
            isOpen={isMenuOpen}
            triggerElement={<EntityAddButton onClick={openMenu} />}
          />
        }
        entityId="modules"
        icon={""}
        isDefaultExpanded
        name={createMessage(MODULES_TITLE)}
        onToggle={onModuleToggle}
        searchKeyword={""}
        showAddButton={canCreateModules}
        step={0}
      >
        <ModuleEntities
          canCreateModules={canCreateModules}
          openCreateNewMenu={openMenu}
          packageId={packageId}
        />
      </StyledEntity>

      <EntityExplorerResizeHandler
        resizeRef={moduleResizeRef}
        storedHeightKey={storedHeightKey}
      />
    </RelativeContainer>
  );
};

export default Modules;
