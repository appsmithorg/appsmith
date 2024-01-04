import React, { useCallback, useMemo } from "react";
import { Flex, List, Text } from "design-system";
import type { ListItemProps } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import keyBy from "lodash/keyBy";
import { useLocation } from "react-router";
import styled from "styled-components";

import { useFilteredFileOperations } from "components/editorComponents/GlobalSearch/GlobalSearchHooks";
import { FocusEntity } from "navigation/FocusEntity";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import { EntityIcon, getPluginIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import type { AppState } from "@appsmith/reducers";
import history from "utils/history";
import { ADD_PATH } from "constants/routes";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { getPagePermissions } from "selectors/editorSelectors";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { createMessage, PAGES_PANE_TEXTS } from "@appsmith/constants/messages";
import SegmentAddHeader from "./components/SegmentAddHeader";

const StyledList = styled(List)`
  padding: 0;
  gap: 0;
`;

const AddQuery = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const pageId = useSelector(getCurrentPageId) as string;
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const pagePermissions = useSelector(getPagePermissions);

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );
  let fileOperations = useFilteredFileOperations({ canCreateActions });
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
        title:
          fileOperation.entityExplorerTitle ||
          fileOperation.dsName ||
          fileOperation.title,
        description: "",
        descriptionType: "inline",
        onClick: addFromSource.bind(null, fileOperation),
      } as ListItemProps;
    });
  };

  const closeButtonClickHandler = useCallback(() => {
    history.push(location.pathname.replace(`${ADD_PATH}`, ""));
  }, [pageId]);

  return (
    <Flex flexDirection="column" gap={"spaces-4"}>
      <SegmentAddHeader
        onCloseClick={closeButtonClickHandler}
        titleMessage={PAGES_PANE_TEXTS.query_create_tab_title}
      />
      <Flex
        flexDirection="column"
        gap="spaces-4"
        overflow="scroll"
        pr="spaces-2"
        px="spaces-3"
      >
        <Flex flexDirection="column">
          {/* From source */}
          <Text
            className="px-[var(--ads-v2-spaces-3)] py-[var(--ads-v2-spaces-1)]"
            color="var(--ads-v2-color-fg-muted)"
            kind="body-s"
          >
            {createMessage(PAGES_PANE_TEXTS.queries_create_from_existing)}
          </Text>
          <StyledList
            className="t--from-source-list"
            items={getListItems(fromExistingSources)}
          />
        </Flex>
        <Flex flexDirection="column">
          {/* From source */}
          <Text
            className="px-[var(--ads-v2-spaces-3)] py-[var(--ads-v2-spaces-1)]"
            color="var(--ads-v2-color-fg-muted)"
            kind="body-s"
          >
            {createMessage(PAGES_PANE_TEXTS.queries_create_new)}
          </Text>
          <StyledList
            className="t--new-blank-api"
            items={getListItems(fromNewBlankAPI)}
          />
        </Flex>
      </Flex>
    </Flex>
  );
};

export { AddQuery };
