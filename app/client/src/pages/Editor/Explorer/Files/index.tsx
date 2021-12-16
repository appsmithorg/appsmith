import React, { useCallback, useMemo } from "react";
import { useFilesForExplorer } from "../hooks";
import { Entity } from "../Entity/index";
import { createMessage, ADD_QUERY_JS_TOOLTIP } from "constants/messages";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { ExplorerActionEntity } from "../Actions/ActionEntity";
import ExplorerJSCollectionEntity from "../JSActions/JSActionEntity";
import { keyBy } from "lodash";
import { getPlugins } from "selectors/entitiesSelector";
import { getActionConfig } from "../Actions/helpers";
import { PluginType } from "entities/Action";
import { toggleShowGlobalSearchModal } from "actions/globalSearchActions";
import { jsFileIcon, SortFileIcon } from "../ExplorerIcons";
import { Colors } from "constants/Colors";
import {
  filterCategories,
  SEARCH_CATEGORY_ID,
} from "components/editorComponents/GlobalSearch/utils";
import EntityPlaceholder from "../Entity/Placeholder";

const emptyNode = (
  <EntityPlaceholder step={0}>
    Click the <strong>+</strong> icon above to create a new query, API or JS
    Object
  </EntityPlaceholder>
);

function Files() {
  const [sortBy, setSortBy] = React.useState("name");
  const pageId = useSelector(getCurrentPageId);
  const files = useFilesForExplorer(sortBy);
  const currentApplicationId = useSelector(getCurrentApplicationId);
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const dispatch = useDispatch();
  const onCreate = useCallback(() => {
    dispatch(
      toggleShowGlobalSearchModal(
        filterCategories[SEARCH_CATEGORY_ID.ACTION_OPERATION],
      ),
    );
  }, [dispatch]);

  const fileEntities = useMemo(
    () =>
      files.map(({ entity, type }: any) => {
        if (type === "group") {
          return (
            <div
              className={`text-sm text-[${Colors.CODE_GRAY}] px-4 my-2 bg-trueGray-100`}
            >
              {entity.name}
            </div>
          );
        } else if (type === "JS") {
          return (
            <ExplorerJSCollectionEntity
              action={entity}
              icon={jsFileIcon}
              key={entity.config.id}
              pageId={pageId as string}
              searchKeyword={""}
              step={2}
            />
          );
        } else {
          const config = getActionConfig(type as PluginType);
          const url = config?.getURL(
            currentApplicationId,
            pageId as string,
            entity.config.id,
            entity.config.pluginType,
            pluginGroups[
              entity.config.pluginId || entity.config.datasource.pluginId
            ],
          );
          const icon = config?.getIcon(
            entity.config,
            pluginGroups[
              entity.config.pluginId || entity.config.datasource.pluginId
            ],
          );

          return (
            <ExplorerActionEntity
              action={entity}
              icon={icon}
              key={entity.config.id}
              pageId={pageId as string}
              searchKeyword={""}
              step={2}
              url={url || ""}
            />
          );
        }
      }),
    [files],
  );

  return (
    <Entity
      addButtonHelptext={createMessage(ADD_QUERY_JS_TOOLTIP)}
      alwaysShowRightIcon
      className={`group`}
      disabled={false}
      entityId={pageId + "_widgets"}
      icon={null}
      isDefaultExpanded
      key={pageId + "_widgets"}
      name="QUERIES/JS"
      onClickRightIcon={() => {
        setSortBy((sort) => (sort === "name" ? "type" : "name"));
      }}
      onCreate={onCreate}
      rightIcon={SortFileIcon}
      searchKeyword={""}
      step={0}
    >
      {fileEntities.length ? fileEntities : emptyNode}
    </Entity>
  );
}

Files.displayName = "Files";

export default Files;
