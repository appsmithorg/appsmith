import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveAction } from "../hooks";
import { Entity, EntityClassNames } from "../Entity/index";
import {
  createMessage,
  ADD_QUERY_JS_BUTTON,
  EMPTY_QUERY_JS_BUTTON_TEXT,
  EMPTY_QUERY_JS_MAIN_TEXT,
} from "@appsmith/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { ExplorerActionEntity } from "../Actions/ActionEntity";
import ExplorerJSCollectionEntity from "../JSActions/JSActionEntity";
import { Colors } from "constants/Colors";
import { selectFilesForExplorer } from "selectors/entitiesSelector";
import { getExplorerStatus, saveExplorerStatus } from "../helpers";
import { Icon } from "design-system";
import { AddEntity, EmptyComponent } from "../common";
import ExplorerSubMenu from "./Submenu";
import { hasCreateActionPermission } from "@appsmith/utils/permissionHelpers";

function Files() {
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId) as string;
  const files = useSelector(selectFilesForExplorer);
  const dispatch = useDispatch();
  const isFilesOpen = getExplorerStatus(applicationId, "queriesAndJs");
  const [isMenuOpen, openMenu] = useState(false);

  const onCreate = useCallback(() => {
    openMenu(true);
  }, [dispatch, openMenu]);

  const activeActionId = useActiveAction();

  useEffect(() => {
    if (!activeActionId) return;
    document.getElementById(`entity-${activeActionId}`)?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [activeActionId]);

  const onFilesToggle = useCallback(
    (isOpen: boolean) => {
      saveExplorerStatus(applicationId, "queriesAndJs", isOpen);
    },
    [applicationId],
  );

  const pagePermissions = useSelector(getPagePermissions);

  const canCreateActions = hasCreateActionPermission(pagePermissions);

  const onMenuClose = useCallback(() => openMenu(false), [openMenu]);

  const fileEntities = useMemo(
    () =>
      files.map(({ entity, type }: any) => {
        if (type === "group") {
          return (
            <div
              className={`text-sm text-[${Colors.CODE_GRAY}] pl-8 bg-trueGray-50 overflow-hidden overflow-ellipsis whitespace-nowrap`}
              key={entity.name || "Queries"}
            >
              {entity.name}
            </div>
          );
        } else if (type === "JS") {
          return (
            <ExplorerJSCollectionEntity
              id={entity.id}
              isActive={entity.id === activeActionId}
              key={entity.id}
              searchKeyword={""}
              step={2}
              type={type}
            />
          );
        } else {
          return (
            <ExplorerActionEntity
              id={entity.id}
              isActive={entity.id === activeActionId}
              key={entity.id}
              searchKeyword={""}
              step={2}
              type={type}
            />
          );
        }
      }),
    [files, activeActionId],
  );

  return (
    <Entity
      alwaysShowRightIcon
      className={`group files`}
      customAddButton={
        <ExplorerSubMenu
          className={`${EntityClassNames.ADD_BUTTON} group files`}
          onMenuClose={onMenuClose}
          openMenu={isMenuOpen}
        />
      }
      disabled={false}
      entityId={pageId + "_widgets"}
      icon={null}
      isDefaultExpanded={
        isFilesOpen === null || isFilesOpen === undefined ? false : isFilesOpen
      }
      isSticky
      key={pageId + "_widgets"}
      name="Queries/JS"
      onCreate={onCreate}
      onToggle={onFilesToggle}
      searchKeyword={""}
      showAddButton={canCreateActions}
      step={0}
    >
      {fileEntities.length ? (
        fileEntities
      ) : (
        <EmptyComponent
          mainText={createMessage(EMPTY_QUERY_JS_MAIN_TEXT)}
          {...(canCreateActions && {
            addBtnText: createMessage(EMPTY_QUERY_JS_BUTTON_TEXT),
            addFunction: onCreate,
          })}
        />
      )}
      {fileEntities.length > 0 && canCreateActions && (
        <AddEntity
          action={onCreate}
          entityId={pageId + "_queries_js_add_new_datasource"}
          icon={<Icon name="plus" />}
          name={createMessage(ADD_QUERY_JS_BUTTON)}
          step={1}
        />
      )}
    </Entity>
  );
}

Files.displayName = "Files";

export default React.memo(Files);
