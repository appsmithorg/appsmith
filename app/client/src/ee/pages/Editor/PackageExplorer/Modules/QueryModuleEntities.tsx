import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ADD_QUERY_MODULE_TOOLTIP,
  EMPTY_QUERY_MODULES_MSG,
  NEW_QUERY_BUTTON,
  QUERY_MODULES_TITLE,
  createMessage,
} from "@appsmith/constants/messages";
import {
  getCurrentPackage,
  getCurrentPackageId,
} from "@appsmith/selectors/packageSelectors";
import {
  ENTITY_HEIGHT,
  RelativeContainer,
  StyledEntity as ModuleEntity,
} from "pages/Editor/Explorer/Common/components";
import { EntityExplorerResizeHandler } from "pages/Editor/Explorer/Common/EntityExplorerResizeHandler";
import { useDispatch, useSelector } from "react-redux";
import { getExplorerPinned } from "selectors/explorerSelector";
import { setExplorerPinnedAction } from "actions/explorerActions";
import {
  getExplorerStatus,
  saveExplorerStatus,
} from "@appsmith/pages/Editor/Explorer/helpers";
import { resolveAsSpaceChar } from "utils/helpers";
import type { Module } from "@appsmith/constants/ModuleConstants";
import {
  getAllModules,
  getCurrentModuleId,
} from "@appsmith/selectors/modulesSelector";
import { Icon } from "design-system";
import {
  hasCreateModulePermission,
  hasManageModulePermission,
} from "@appsmith/utils/permissionHelpers";
import type { AppState } from "@appsmith/reducers";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";
import { saveModuleName } from "@appsmith/actions/moduleActions";
import { EmptyComponent } from "pages/Editor/Explorer/common";
import ExplorerSubMenu from "pages/Editor/Explorer/Files/Submenu";
import history, { NavigationMethod } from "utils/history";
import {
  convertModulesToArray,
  selectAllQueryModules,
} from "@appsmith/utils/Packages/moduleHelpers";
import type { ModulesReducerState } from "@appsmith/reducers/entityReducers/modulesReducer";

const QueryModuleEntities = () => {
  const packageId = useSelector(getCurrentPackageId) || "";
  const allModules: ModulesReducerState = useSelector(getAllModules);
  const modules: Module[] = convertModulesToArray(allModules);
  const queryModules: Module[] = selectAllQueryModules(modules);
  const currentModuleId = useSelector(getCurrentModuleId);
  const pinned = useSelector(getExplorerPinned);
  const dispatch = useDispatch();
  const isModulesOpen = getExplorerStatus(packageId, "packages");
  const moduleResizeRef = useRef<HTMLDivElement>(null);
  const storedHeightKey = "modulesContainerHeight_" + packageId;
  const storedHeight = localStorage.getItem(storedHeightKey);

  useEffect(() => {
    if (
      (isModulesOpen === null ? true : isModulesOpen) &&
      moduleResizeRef.current
    ) {
      moduleResizeRef.current.style.height = storedHeight + "px";
    }
  }, [moduleResizeRef]);

  const [isMenuOpen, openMenu] = useState(false);

  const onMenuClose = useCallback(() => openMenu(false), [openMenu]);

  /**
   * toggles the pinned state of sidebar
   */
  const onPin = useCallback(() => {
    dispatch(setExplorerPinnedAction(!pinned));
  }, [pinned, dispatch, setExplorerPinnedAction]);

  const onModuleToggle = useCallback(
    (isOpen: boolean) => {
      saveExplorerStatus(packageId, "packages", isOpen);
    },
    [packageId],
  );

  const onCreate = useCallback(() => {
    openMenu(true);
  }, [dispatch, openMenu]);

  const switchQModule = useCallback(
    (module: Module) => {
      const navigateToUrl = `pkg/${packageId}/module/${module.id}`;
      history.push(navigateToUrl, {
        invokedBy: NavigationMethod.EntityExplorer,
      });
    },
    [packageId, module.id],
  );

  const userPackagePermissions = useSelector(
    (state: AppState) => getCurrentPackage(state)?.userPermissions ?? [],
  );

  const canCreateModules = hasCreateModulePermission(userPackagePermissions);

  const moduleElements = useMemo(
    () =>
      queryModules.map((module) => {
        const icon = <Icon name="module" size={20} />;
        const isCurrentModule = currentModuleId === module.id;
        const modulePermissions = module.userPermissions;
        const canManageModules = hasManageModulePermission(modulePermissions);
        /*const contextMenu = (
          <ModuleContextMenu
            className={EntityClassNames.CONTEXT_MENU}
            isDefaultPage={module.isDefault}
            key={module.id + "_context-menu"}
            moduleId={module.id}
            name={module.name}
            packageId={packageId as string}
          />
        );*/
        const contextMenu = null;

        return (
          <ModuleEntity
            action={() => switchQModule(module)}
            active={isCurrentModule}
            canEditEntityName={canManageModules}
            className={`query-module ${isCurrentModule && "activeModule"}`}
            contextMenu={contextMenu}
            entityId={module.id}
            icon={icon}
            isDefaultExpanded={isCurrentModule}
            key={module.id}
            name={module.name}
            onNameEdit={resolveAsSpaceChar}
            searchKeyword={""}
            step={1}
            updateEntityName={(id, name) =>
              saveModuleName({ id, newName: name, publicEntityId: "" })
            }
          />
        );
      }),
    [currentModuleId],
  );

  return (
    <RelativeContainer className="border-b pb-1">
      <ModuleEntity
        addButtonHelptext={createMessage(ADD_QUERY_MODULE_TOOLTIP)}
        alwaysShowRightIcon
        className="pb-0 group query-modules"
        collapseRef={moduleResizeRef}
        customAddButton={
          <ExplorerSubMenu
            canCreateActions={canCreateModules}
            className={`${EntityClassNames.ADD_BUTTON} group files`}
            onMenuClose={onMenuClose}
            openMenu={isMenuOpen}
          />
        }
        entityId={createMessage(QUERY_MODULES_TITLE)}
        entitySize={
          queryModules.length > 0 ? ENTITY_HEIGHT * queryModules.length : 156
        }
        icon={""}
        isDefaultExpanded={
          isModulesOpen === null || isModulesOpen === undefined
            ? true
            : isModulesOpen
        }
        name={createMessage(QUERY_MODULES_TITLE)}
        onClickPreRightIcon={onPin}
        onToggle={onModuleToggle}
        searchKeyword={""}
        showAddButton={canCreateModules}
        step={0}
      >
        {moduleElements.length ? (
          moduleElements
        ) : (
          <EmptyComponent
            mainText={createMessage(EMPTY_QUERY_MODULES_MSG)}
            {...(canCreateModules && {
              addBtnText: createMessage(NEW_QUERY_BUTTON),
              addFunction: onCreate,
            })}
          />
        )}
      </ModuleEntity>
      <EntityExplorerResizeHandler
        resizeRef={moduleResizeRef}
        storedHeightKey={storedHeightKey}
      />
    </RelativeContainer>
  );
};

export default QueryModuleEntities;
