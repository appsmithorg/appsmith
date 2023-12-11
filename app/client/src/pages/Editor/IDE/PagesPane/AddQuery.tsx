import React, { useCallback, useMemo } from "react";
import { Button, Flex, List, Text } from "design-system";
import type { ListItemProps } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import keyBy from "lodash/keyBy";
import { useLocation } from "react-router";

import { useFilteredFileOperations } from "components/editorComponents/GlobalSearch/GlobalSearchHooks";
import { FocusEntity } from "navigation/FocusEntity";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import { EntityIcon, getPluginIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import type { AppState } from "@appsmith/reducers";
import history from "utils/history";
import { ADD_PATH } from "constants/routes";

const AddQuery = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const pageId = useSelector(getCurrentPageId) as string;
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
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

  const closeButtonClickHandler = useCallback(() => {
    history.push(location.pathname.replace(`${ADD_PATH}`, ""));
  }, [pageId]);

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

export { AddQuery };
