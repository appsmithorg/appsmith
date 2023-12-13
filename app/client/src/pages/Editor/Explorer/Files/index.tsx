import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import { Entity, EntityClassNames } from "../Entity/index";
import {
  createMessage,
  ADD_QUERY_JS_BUTTON,
  EMPTY_QUERY_JS_BUTTON_TEXT,
  EMPTY_QUERY_JS_MAIN_TEXT,
  ADD_QUERY_JS_TOOLTIP,
} from "@appsmith/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import { ExplorerActionEntity } from "../Actions/ActionEntity";
import ExplorerJSCollectionEntity from "../JSActions/JSActionEntity";
import { selectFilesForExplorer } from "@appsmith/selectors/entitiesSelector";
import {
  getExplorerStatus,
  saveExplorerStatus,
} from "@appsmith/pages/Editor/Explorer/helpers";
import { AddEntity, EmptyComponent } from "../common";
import ExplorerSubMenu from "./Submenu";
import { Icon, Text } from "design-system";
import styled from "styled-components";
import { useFilteredFileOperations } from "components/editorComponents/GlobalSearch/GlobalSearchHooks";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import { ExplorerModuleInstanceEntity } from "@appsmith/pages/Editor/Explorer/ModuleInstanceEntity";
import { FilesContext } from "./FilesContextProvider";

const StyledText = styled(Text)`
  color: var(--ads-v2-color-fg-emphasis);
  display: block;
  padding-top: 8px;
  padding-bottom: 4px;
`;
function Files() {
  // Import the context
  const context = useContext(FilesContext);
  const { canCreateActions, parentEntityId, parentEntityType } = context;

  const files = useSelector(selectFilesForExplorer);
  const dispatch = useDispatch();
  const isFilesOpen = getExplorerStatus(parentEntityId, "queriesAndJs");
  const [isMenuOpen, openMenu] = useState(false);
  const [query, setQuery] = useState("");

  const fileOperations = useFilteredFileOperations(query, canCreateActions);

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
      saveExplorerStatus(parentEntityId, "queriesAndJs", isOpen);
    },
    [parentEntityId],
  );

  const onMenuClose = useCallback(() => openMenu(false), [openMenu]);

  const fileEntities = useMemo(
    () =>
      files.map(({ entity, type }: any) => {
        if (type === "group") {
          return (
            <StyledText
              className="pl-8 overflow-hidden overflow-ellipsis whitespace-nowrap"
              key={entity.name || "Queries"}
              kind="heading-xs"
            >
              {entity.name}
            </StyledText>
          );
        } else if (type === "moduleInstance") {
          return (
            <ExplorerModuleInstanceEntity
              id={entity.id}
              isActive={entity.id === activeActionId}
              key={entity.id}
              searchKeyword={""}
              step={2}
              type={type}
            />
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
              parentEntityId={parentEntityId}
              searchKeyword={""}
              step={2}
              type={type}
            />
          );
        }
      }),
    [files, activeActionId],
  );

  const handleClick = useCallback(
    (item: any) => {
      if (item.kind === SEARCH_ITEM_TYPES.sectionTitle) return;
      if (item.action) {
        dispatch(
          item.action(
            parentEntityId,
            DatasourceCreateEntryPoints.SUBMENU,
            parentEntityType,
          ),
        );
      } else if (item.redirect) {
        item.redirect(
          parentEntityId,
          DatasourceCreateEntryPoints.SUBMENU,
          parentEntityType,
        );
      }
    },
    [parentEntityId, dispatch],
  );

  return (
    <Entity
      alwaysShowRightIcon
      className={`group files`}
      customAddButton={
        <ExplorerSubMenu
          canCreate={canCreateActions}
          className={`${EntityClassNames.ADD_BUTTON} group files`}
          fileOperations={fileOperations}
          handleClick={handleClick}
          onMenuClose={onMenuClose}
          openMenu={isMenuOpen}
          query={query}
          setQuery={setQuery}
          tooltipText={createMessage(ADD_QUERY_JS_TOOLTIP)}
        />
      }
      entityId={parentEntityId + "_actions"}
      icon={null}
      isDefaultExpanded={
        isFilesOpen === null || isFilesOpen === undefined ? true : isFilesOpen
      }
      isSticky
      key={parentEntityId + "_actions"}
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
          entityId={parentEntityId + "_queries_js_add_new_datasource"}
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
