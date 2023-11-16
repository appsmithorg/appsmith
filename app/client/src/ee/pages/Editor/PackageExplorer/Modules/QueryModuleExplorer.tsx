import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ADD_QUERY_BUTTON,
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
} from "pages/Editor/Explorer/Common/components";
import { EntityExplorerResizeHandler } from "pages/Editor/Explorer/Common/EntityExplorerResizeHandler";
import { useDispatch, useSelector } from "react-redux";
import { getExplorerPinned } from "selectors/explorerSelector";
import { setExplorerPinnedAction } from "actions/explorerActions";
import {
  getExplorerStatus,
  saveExplorerStatus,
} from "@appsmith/pages/Editor/Explorer/helpers";
import type { Module } from "@appsmith/constants/ModuleConstants";
import {
  getAllModules,
  getCurrentModuleId,
} from "@appsmith/selectors/modulesSelector";
import { Icon } from "design-system";
import { hasCreateModulePermission } from "@appsmith/utils/permissionHelpers";
import type { AppState } from "@appsmith/reducers";
import Entity, { EntityClassNames } from "pages/Editor/Explorer/Entity";
import { AddEntity, EmptyComponent } from "pages/Editor/Explorer/common";
import ExplorerSubMenu from "pages/Editor/Explorer/Files/Submenu";
import {
  convertModulesToArray,
  selectAllQueryModules,
} from "@appsmith/utils/Packages/moduleHelpers";
import type { ModulesReducerState } from "@appsmith/reducers/entityReducers/modulesReducer";
import QueryModuleEntity from "./QueryModules/Entity";
import { useFilteredFileOperations } from "./hooks/getFilteredFileOps";
import {
  type ActionOperation,
  SEARCH_ITEM_TYPES,
} from "components/editorComponents/GlobalSearch/utils";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import type { EventLocation } from "ce/utils/analyticsUtilTypes";
import styled from "styled-components";

const MIN_MODULES_HEIGHT = 156;

export const StyledEntity = styled(Entity)<{ entitySize?: number }>`
  &.query-modules > div:not(.t--entity-item) > div > div {
      max-height: 40vh;
      min-height: ${({ entitySize }) =>
        entitySize && entitySize > MIN_MODULES_HEIGHT
          ? MIN_MODULES_HEIGHT
          : entitySize}px;
      height: ${({ entitySize }) =>
        entitySize && entitySize > 128 ? 128 : entitySize}px;
      overflow-y: auto;
    }
  }
`;

const QueryModuleExplorer = () => {
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
  const [query, setQuery] = useState("");

  const fileOperations = useFilteredFileOperations(query);

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

  const userPackagePermissions = useSelector(
    (state: AppState) => getCurrentPackage(state)?.userPermissions ?? [],
  );

  const canCreateModules = hasCreateModulePermission(userPackagePermissions);

  const moduleElements = queryModules.map((module) => (
    <QueryModuleEntity
      currentModuleId={currentModuleId}
      key={module.id}
      module={module}
      packageId={packageId}
    />
  ));

  const handleClick = useCallback(
    (item: ActionOperation) => {
      if (item.kind === SEARCH_ITEM_TYPES.sectionTitle) return;
      if (item.action) {
        dispatch(
          item.action(
            packageId,
            DatasourceCreateEntryPoints.SUBMENU as EventLocation,
          ),
        );
      } else if (item.redirect) {
        item.redirect(
          packageId,
          DatasourceCreateEntryPoints.SUBMENU as EventLocation,
        );
      }
    },
    [packageId],
  );

  return (
    <RelativeContainer
      className="border-b pb-1"
      data-testid="t--query-module-explorer"
    >
      <StyledEntity
        addButtonHelptext={createMessage(ADD_QUERY_MODULE_TOOLTIP)}
        alwaysShowRightIcon
        className="pb-0 group query-modules"
        collapseRef={moduleResizeRef}
        customAddButton={
          <ExplorerSubMenu
            canCreate={canCreateModules}
            className={`${EntityClassNames.ADD_BUTTON} group files`}
            fileOperations={fileOperations}
            handleClick={handleClick}
            onMenuClose={onMenuClose}
            openMenu={isMenuOpen}
            query={query}
            setQuery={setQuery}
            tooltipText={createMessage(ADD_QUERY_MODULE_TOOLTIP)}
          />
        }
        entityId={createMessage(QUERY_MODULES_TITLE)}
        entitySize={
          queryModules.length > 0
            ? ENTITY_HEIGHT * queryModules.length + ENTITY_HEIGHT
            : 156
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
        {moduleElements.length > 0 && canCreateModules && (
          <AddEntity
            action={onCreate}
            entityId={packageId + "_queries_js_add_new_datasource"}
            icon={<Icon name="plus" />}
            name={createMessage(ADD_QUERY_BUTTON)}
            step={1}
          />
        )}
      </StyledEntity>
      <EntityExplorerResizeHandler
        resizeRef={moduleResizeRef}
        storedHeightKey={storedHeightKey}
      />
    </RelativeContainer>
  );
};

export default QueryModuleExplorer;
