import React, { useCallback, useMemo } from "react";
import { useFilesForExplorer } from "../hooks";
import { Entity } from "../Entity/index";
import { createMessage, ADD_WIDGET_TOOLTIP } from "constants/messages";
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
import { jsFileIcon } from "../ExplorerIcons";
import { Colors } from "constants/Colors";
import {
  filterCategories,
  SEARCH_CATEGORY_ID,
} from "components/editorComponents/GlobalSearch/utils";

function Files() {
  const files = useFilesForExplorer("type");
  const currentPageId = useSelector(getCurrentPageId);
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

  return (
    <Entity
      addButtonHelptext={createMessage(ADD_WIDGET_TOOLTIP)}
      className={`group`}
      disabled={false}
      entityId={currentPageId + "_widgets"}
      icon={""}
      isDefaultExpanded
      key={currentPageId + "_widgets"}
      name="QUERIES/JS"
      onCreate={onCreate}
      searchKeyword={""}
      step={-1}
    >
      {files.map(({ entity, type }: any) => {
        if (type === "group") {
          return (
            <div className={`text-xs text-[${Colors.CODE_GRAY}] px-8 my-2`}>
              {entity.name}
            </div>
          );
        } else if (type === "JS") {
          return (
            <ExplorerJSCollectionEntity
              action={entity}
              icon={jsFileIcon}
              key={entity.config.id}
              pageId={currentPageId as string}
              searchKeyword={""}
              step={2}
            />
          );
        } else {
          const config = getActionConfig(type as PluginType);
          const url = config?.getURL(
            currentApplicationId,
            currentPageId as string,
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
              active={false}
              icon={icon}
              key={entity.config.id}
              pageId={currentPageId as string}
              searchKeyword={""}
              step={2}
              url={url || ""}
            />
          );
        }
      })}
    </Entity>
  );
}

Files.displayName = "Files";

export default Files;
