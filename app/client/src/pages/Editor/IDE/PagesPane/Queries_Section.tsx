import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ListItemProps } from "design-system";
import { Flex, Text, Button, List } from "design-system";
import styled from "styled-components";
import keyBy from "lodash/keyBy";
import { matchPath } from "react-router";

import {
  getCurrentPageId,
  selectQueriesForPagespane,
} from "@appsmith/selectors/entitiesSelector";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import ExplorerActionEntity from "pages/Editor/Explorer/Actions/ActionEntity";
import { getPagePermissions } from "../../../../selectors/editorSelectors";
import { useFeatureFlag } from "../../../../utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useFilteredFileOperations } from "../../../../components/editorComponents/GlobalSearch/GlobalSearchHooks";
import { FocusEntity } from "navigation/FocusEntity";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import { EntityIcon, getPluginIcon } from "pages/Editor/Explorer/ExplorerIcons";
import type { AppState } from "@appsmith/reducers";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import {
  API_EDITOR_ID_ADD_PATH,
  API_EDITOR_ID_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  QUERIES_EDITOR_ID_ADD_PATH,
  QUERIES_EDITOR_ID_PATH,
} from "constants/routes";
import {
  SAAS_EDITOR_API_ID_ADD_PATH,
  SAAS_EDITOR_API_ID_PATH,
} from "pages/Editor/SaaSEditor/constants";
import history from "utils/history";

const QueriesContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 4px auto 1fr auto auto auto auto auto;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const QueriesSection = () => {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId) as string;
  let files = useSelector(selectQueriesForPagespane);
  files = Object.keys(files).reduce((acc: any, key) => {
    if (key !== "JS Objects") {
      acc[key] = files[key];
    }
    return acc;
  }, {});

  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const match = matchPath<{
    queryId?: string;
    sidebarState?: string;
  }>(location.pathname, [
    BUILDER_PATH_DEPRECATED + API_EDITOR_ID_ADD_PATH,
    BUILDER_PATH_DEPRECATED + API_EDITOR_ID_PATH,
    BUILDER_PATH + API_EDITOR_ID_ADD_PATH,
    BUILDER_PATH + API_EDITOR_ID_PATH,
    BUILDER_CUSTOM_PATH + API_EDITOR_ID_ADD_PATH,
    BUILDER_CUSTOM_PATH + API_EDITOR_ID_PATH,
    BUILDER_PATH_DEPRECATED + QUERIES_EDITOR_ID_ADD_PATH,
    BUILDER_PATH_DEPRECATED + QUERIES_EDITOR_ID_PATH,
    BUILDER_PATH + QUERIES_EDITOR_ID_ADD_PATH,
    BUILDER_PATH + QUERIES_EDITOR_ID_PATH,
    BUILDER_CUSTOM_PATH + QUERIES_EDITOR_ID_ADD_PATH,
    BUILDER_CUSTOM_PATH + QUERIES_EDITOR_ID_PATH,
    BUILDER_PATH_DEPRECATED + SAAS_EDITOR_API_ID_ADD_PATH,
    BUILDER_PATH_DEPRECATED + SAAS_EDITOR_API_ID_PATH,
    BUILDER_PATH + SAAS_EDITOR_API_ID_ADD_PATH,
    BUILDER_PATH + SAAS_EDITOR_API_ID_PATH,
    BUILDER_CUSTOM_PATH + SAAS_EDITOR_API_ID_ADD_PATH,
    BUILDER_CUSTOM_PATH + SAAS_EDITOR_API_ID_PATH,
  ]);
  const isAddPage =
    match?.params?.sidebarState === "add" || match?.params?.queryId === "add";
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const activeActionId = useActiveAction();

  const pagePermissions = useSelector(getPagePermissions);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const addButtonClickHandler = useCallback(() => {
    history.push(`${location.pathname}/add`);
  }, [pageId]);

  const closeButtonClickHandler = useCallback(() => {
    history.push(location.pathname.replace("/add", ""));
  }, [pageId]);

  const ListingSection = () => (
    <Flex flexDirection="column" padding="spaces-4">
      {canCreateActions && (
        <Button
          kind={"secondary"}
          onClick={addButtonClickHandler}
          size={"sm"}
          startIcon={"add-line"}
        >
          New query/API
        </Button>
      )}

      {Object.keys(files).map((key) => {
        return (
          <Flex flexDirection={"column"} key={key}>
            <Flex px="spaces-3">
              <Text
                className="overflow-hidden overflow-ellipsis whitespace-nowrap"
                kind="heading-xs"
              >
                {key}
              </Text>
            </Flex>
            {files[key].map((file: any) => {
              return (
                <ExplorerActionEntity
                  id={file.id}
                  isActive={file.id === activeActionId}
                  key={file.id}
                  searchKeyword={""}
                  step={2}
                  type={file.type}
                />
              );
            })}
          </Flex>
        );
      })}

      {Object.keys(files).length === 0 && (
        <Flex px="spaces-3">
          <Text
            className="overflow-hidden overflow-ellipsis whitespace-nowrap"
            kind="heading-xs"
          >
            No queries to display
          </Text>
        </Flex>
      )}
    </Flex>
  );

  const AddQuerySection = () => {
    let fileOperations = useFilteredFileOperations();
    fileOperations = fileOperations.filter(
      (fileOperation) =>
        fileOperation.focusEntityType !== FocusEntity.JS_OBJECT &&
        fileOperation.kind === SEARCH_ITEM_TYPES.actionOperation,
    );
    const fromExistingSources = fileOperations.filter(
      (fileOperation) =>
        fileOperation.focusEntityType === FocusEntity.QUERY ||
        fileOperation.focusEntityType === FocusEntity.DATASOURCE,
    );
    const fromNewBlankAPI = fileOperations.filter(
      (fileOperation) => fileOperation.focusEntityType === FocusEntity.API,
    );

    const addFromSource = useCallback(
      (item: any) => {
        if (item.kind === SEARCH_ITEM_TYPES.sectionTitle) return;
        if (item.action) {
          dispatch(item.action(pageId, DatasourceCreateEntryPoints.SUBMENU));
        } else if (item.redirect) {
          item.redirect(pageId, DatasourceCreateEntryPoints.SUBMENU);
        }
      },
      [pageId, dispatch],
    );

    const getListItems = (data: any[]) => {
      return data.map((fileOperation) => {
        const icon =
          fileOperation.icon ||
          (fileOperation.pluginId && (
            <EntityIcon>
              {getPluginIcon(pluginGroups[fileOperation.pluginId])}
            </EntityIcon>
          ));
        return {
          startIcon: icon,
          title: fileOperation.dsName || fileOperation.title,
          description: "",
          descriptionType: "inline",
          onClick: addFromSource.bind(null, fileOperation),
        } as ListItemProps;
      });
    };

    return (
      <>
        <Flex
          alignItems="center"
          borderBottom={"1px solid var(--ads-v2-color-border)"}
          justifyContent="space-between"
          padding="spaces-4"
          paddingBottom="spaces-3"
        >
          <Text
            className="overflow-hidden overflow-ellipsis whitespace-nowrap"
            color="var(--ads-v2-color-fg)"
            kind="heading-xs"
          >
            Create new query/API
          </Text>
          <Button
            isIconButton
            kind={"tertiary"}
            onClick={closeButtonClickHandler}
            size={"sm"}
            startIcon={"close-line"}
          />
        </Flex>
        <Flex flexDirection="column" gap="spaces-3" padding="spaces-4">
          <Flex flexDirection="column" gap="spaces-2">
            {/* From source */}
            <Text
              className="overflow-hidden overflow-ellipsis whitespace-nowrap"
              color="var(--ads-v2-color-fg-muted)"
              kind="body-s"
            >
              From existing datasource
            </Text>
            <List
              className="t--from-source-list"
              items={getListItems(fromExistingSources)}
            />
          </Flex>
          <Flex flexDirection="column" gap="spaces-2">
            {/* From source */}
            <Text
              className="overflow-hidden overflow-ellipsis whitespace-nowrap"
              color="var(--ads-v2-color-fg-muted)"
              kind="body-s"
            >
              New Blank API
            </Text>
            <List
              className="t--new-blank-api"
              items={getListItems(fromNewBlankAPI)}
            />
          </Flex>
        </Flex>
      </>
    );
  };

  return (
    <QueriesContainer
      className="ide-pages-pane__content-queries"
      flexDirection="column"
      gap="spaces-3"
      overflow="scroll"
    >
      {isAddPage ? <AddQuerySection /> : <ListingSection />}
    </QueriesContainer>
  );
};

export { QueriesSection };
