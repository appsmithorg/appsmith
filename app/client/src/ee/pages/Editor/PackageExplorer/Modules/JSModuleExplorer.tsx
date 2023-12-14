import React, { useCallback, useRef } from "react";
import {
  ADD_JS_BUTTON,
  ADD_JS_MODULE_TOOLTIP,
  EMPTY_JS_MODULES_MSG,
  JS_MODULES_TITLE,
  NEW_JS_MODULE_BUTTON,
  createMessage,
} from "@appsmith/constants/messages";
import {
  getCurrentPackage,
  getCurrentPackageId,
} from "@appsmith/selectors/packageSelectors";
import { useDispatch, useSelector } from "react-redux";
import { getExplorerPinned } from "selectors/explorerSelector";
import { setExplorerPinnedAction } from "actions/explorerActions";
import type { Module } from "@appsmith/constants/ModuleConstants";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import {
  getAllModules,
  getCurrentModuleId,
} from "@appsmith/selectors/modulesSelector";
import { Icon, Tooltip } from "design-system";
import { hasCreateModulePermission } from "@appsmith/utils/permissionHelpers";
import type { AppState } from "@appsmith/reducers";
import Entity, {
  AddButtonWrapper,
  EntityClassNames,
} from "pages/Editor/Explorer/Entity";
import { AddEntity, EmptyComponent } from "pages/Editor/Explorer/common";
import {
  convertModulesToArray,
  selectAllJSModules,
} from "@appsmith/utils/Packages/moduleHelpers";
import type { ModulesReducerState } from "@appsmith/reducers/entityReducers/modulesReducer";
import QueryModuleEntity from "./Entity";
import EntityAddButton from "pages/Editor/Explorer/Entity/AddButton";
import { createJSModule } from "@appsmith/actions/moduleActions";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import { entitySections } from "@appsmith/reducers/uiReducers/editorContextReducer";

interface QueryModuleExplorerProps {
  onUpdateOpenState: (moduleType: MODULE_TYPE, isOpen: boolean) => void;
}

const JSModuleExplorer = ({ onUpdateOpenState }: QueryModuleExplorerProps) => {
  const packageId = useSelector(getCurrentPackageId) || "";
  const allModules: ModulesReducerState = useSelector(getAllModules);
  const modules: Module[] = convertModulesToArray(allModules);
  const jsModules: Module[] = selectAllJSModules(modules);
  const currentModuleId = useSelector(getCurrentModuleId);
  const pinned = useSelector(getExplorerPinned);
  const dispatch = useDispatch();
  const moduleResizeRef = useRef<HTMLDivElement>(null);

  /**
   * toggles the pinned state of sidebar
   */
  const onPin = useCallback(() => {
    dispatch(setExplorerPinnedAction(!pinned));
  }, [pinned, dispatch, setExplorerPinnedAction]);

  const onModuleToggle = useCallback((isOpen: boolean) => {
    onUpdateOpenState(MODULE_TYPE.QUERY, isOpen);
  }, []);

  const onCreate = useCallback(() => {
    dispatch(
      createJSModule({
        packageId,
        from: DatasourceCreateEntryPoints.SUBMENU,
      }),
    );
  }, [dispatch, createJSModule]);

  const userPackagePermissions = useSelector(
    (state: AppState) => getCurrentPackage(state)?.userPermissions ?? [],
  );

  const canCreateModules = hasCreateModulePermission(userPackagePermissions);

  const moduleElements = jsModules.map((module) => (
    <QueryModuleEntity
      currentModuleId={currentModuleId}
      key={module.id}
      module={module}
      packageId={packageId}
    />
  ));

  const addButton = canCreateModules && (
    <Tooltip
      content={<>{createMessage(ADD_JS_MODULE_TOOLTIP)} </>}
      placement="right"
    >
      <AddButtonWrapper>
        <EntityAddButton
          className={`${EntityClassNames.ADD_BUTTON} group files`}
          onClick={onCreate}
        />
      </AddButtonWrapper>
    </Tooltip>
  );

  return (
    <Entity
      addButtonHelptext={createMessage(ADD_JS_MODULE_TOOLTIP)}
      alwaysShowRightIcon
      className="pb-0 group js-modules"
      collapseRef={moduleResizeRef}
      customAddButton={addButton}
      entityId={entitySections.JSModules}
      icon={""}
      isDefaultExpanded={false}
      name={createMessage(JS_MODULES_TITLE)}
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
          mainText={createMessage(EMPTY_JS_MODULES_MSG)}
          {...(canCreateModules && {
            addBtnText: createMessage(NEW_JS_MODULE_BUTTON),
            addFunction: onCreate,
          })}
        />
      )}
      {moduleElements.length > 0 && canCreateModules && (
        <AddEntity
          action={onCreate}
          entityId={packageId + "_queries_js_add_new_datasource"}
          icon={<Icon name="plus" />}
          name={createMessage(ADD_JS_BUTTON)}
          step={1}
        />
      )}
    </Entity>
  );
};

export default JSModuleExplorer;
