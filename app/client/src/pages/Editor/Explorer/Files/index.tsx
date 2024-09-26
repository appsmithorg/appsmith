import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useActiveActionBaseId } from "ee/pages/Editor/Explorer/hooks";
import { Entity, EntityClassNames } from "../Entity/index";
import {
  createMessage,
  ADD_QUERY_JS_BUTTON,
  EMPTY_QUERY_JS_BUTTON_TEXT,
  EMPTY_QUERY_JS_MAIN_TEXT,
  ADD_QUERY_JS_TOOLTIP,
} from "ee/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import { ExplorerActionEntity } from "../Actions/ActionEntity";
import ExplorerJSCollectionEntity from "../JSActions/JSActionEntity";
import {
  getExplorerStatus,
  saveExplorerStatus,
} from "ee/pages/Editor/Explorer/helpers";
import { AddEntity, EmptyComponent } from "../common";
import ExplorerSubMenu from "./Submenu";
import { Icon, Text } from "@appsmith/ads";
import styled from "styled-components";
import { useFilteredFileOperations } from "components/editorComponents/GlobalSearch/GlobalSearchHooks";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import { ExplorerModuleInstanceEntity } from "ee/pages/Editor/Explorer/ModuleInstanceEntity";
import { FilesContext } from "./FilesContextProvider";
import { selectFilesForExplorer as default_selectFilesForExplorer } from "ee/selectors/entitiesSelector";

const StyledText = styled(Text)`
  color: var(--ads-v2-color-fg-emphasis);
  display: block;
  padding-top: 8px;
  padding-bottom: 4px;
`;

function Files() {
  // Import the context
  const context = useContext(FilesContext);
  const {
    canCreateActions,
    editorId,
    parentEntityId,
    parentEntityType,
    selectFilesForExplorer = default_selectFilesForExplorer,
    showModules = true,
    showWorkflows = true,
  } = context;

  const files = useSelector(selectFilesForExplorer);
  const dispatch = useDispatch();
  // Accordion state for the app/worflow/module explorer
  const isFilesOpen = getExplorerStatus(editorId, "queriesAndJs");
  const [isMenuOpen, openMenu] = useState(false);
  const [query, setQuery] = useState("");

  const fileOperations = useFilteredFileOperations({
    query,
    canCreateActions,
    showModules,
    showWorkflows,
  });

  const onCreate = useCallback(() => {
    openMenu(true);
  }, [openMenu]);

  const activeActionBaseId = useActiveActionBaseId();

  useEffect(() => {
    if (!activeActionBaseId) return;

    document.getElementById(`entity-${activeActionBaseId}`)?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [activeActionBaseId]);

  const onFilesToggle = useCallback(
    (isOpen: boolean) => {
      saveExplorerStatus(editorId, "queriesAndJs", isOpen);
    },
    [editorId],
  );

  const onMenuClose = useCallback(() => openMenu(false), [openMenu]);

  const fileEntities = useMemo(
    () =>
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              isActive={entity.id === activeActionBaseId}
              key={entity.id}
              searchKeyword={""}
              step={2}
            />
          );
        } else if (type === "JS") {
          return (
            <ExplorerJSCollectionEntity
              baseCollectionId={entity.id}
              isActive={entity.id === activeActionBaseId}
              key={entity.id}
              parentEntityId={parentEntityId}
              parentEntityType={parentEntityType}
              searchKeyword={""}
              step={2}
              type={type}
            />
          );
        } else {
          return (
            <ExplorerActionEntity
              baseId={entity.id}
              isActive={entity.id === activeActionBaseId}
              key={entity.id}
              parentEntityId={parentEntityId}
              parentEntityType={parentEntityType}
              searchKeyword={""}
              step={2}
              type={type}
            />
          );
        }
      }),
    [files, activeActionBaseId, parentEntityId, parentEntityType],
  );

  const handleClick = useCallback(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        item.redirect(parentEntityId, DatasourceCreateEntryPoints.SUBMENU);
      }
    },
    [dispatch, parentEntityId, parentEntityType],
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
