import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { getHasCreateActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFilteredFileOperations } from "components/editorComponents/GlobalSearch/GlobalSearchHooks";
import { FocusEntity } from "navigation/FocusEntity";
import {
  type ActionOperation,
  SEARCH_ITEM_TYPES,
} from "components/editorComponents/GlobalSearch/utils";
import type { GroupedAddOperations } from "IDE/Interfaces/GroupedAddOperations";
import type {
  EntityGroupProps,
  EntityItemProps,
  ListItemProps,
} from "@appsmith/ads";
import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import type { DefaultRootState } from "react-redux";
import { useCallback, useMemo } from "react";
import keyBy from "lodash/keyBy";
import { createAddClassName } from "pages/AppIDE/constants";
import { getPluginEntityIcon } from "pages/Editor/Explorer/ExplorerIcons";

export const useAddQueryListItems = () => {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId) as string;
  const plugins = useSelector((state: DefaultRootState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);

  const onCreateItemClick = useCallback(
    (item: ActionOperation) => {
      if (item.action) {
        dispatch(item.action(pageId, "ENTITY_EXPLORER"));
      } else if (item.redirect) {
        item.redirect(pageId, "ENTITY_EXPLORER");
      }
    },
    [pageId, dispatch],
  );

  const getListItems = (data: ActionOperation[]) => {
    return data
      .map((fileOperation) => {
        let title =
          fileOperation.entityExplorerTitle ||
          fileOperation.dsName ||
          fileOperation.title;

        title =
          fileOperation.focusEntityType === FocusEntity.QUERY_MODULE_INSTANCE
            ? fileOperation.title
            : title;
        const className = createAddClassName(title);
        const icon =
          fileOperation.icon ||
          (fileOperation.pluginId &&
            getPluginEntityIcon(pluginGroups[fileOperation.pluginId]));

        if (fileOperation.pluginId && !pluginGroups[fileOperation.pluginId]) {
          return undefined;
        }

        return {
          startIcon: icon,
          className: className,
          title,
          description:
            fileOperation.focusEntityType === FocusEntity.QUERY_MODULE_INSTANCE
              ? fileOperation.dsName
              : "",
          descriptionType: "inline",
          onClick: onCreateItemClick.bind(null, fileOperation),
        } as ListItemProps;
      })
      .filter((item) => item !== undefined);
  };

  return { getListItems };
};
export const useGroupedAddQueryOperations = () => {
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const pagePermissions = useSelector(getPagePermissions);
  const { getListItems } = useAddQueryListItems();

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );
  const fileOperations = useFilteredFileOperations({ canCreateActions });
  const fromExistingSources = fileOperations.filter(
    (fileOperation) =>
      (fileOperation.focusEntityType === FocusEntity.QUERY ||
        fileOperation.focusEntityType === FocusEntity.DATASOURCE) &&
      fileOperation.kind !== SEARCH_ITEM_TYPES.sectionTitle,
  );
  const fromNewBlankAPI = fileOperations.filter(
    (fileOperation) => fileOperation.focusEntityType === FocusEntity.API,
  );

  const groups: GroupedAddOperations = [];
  const groupedItems: EntityGroupProps<ListItemProps | EntityItemProps>[] = [];

  /** From existing Datasource **/

  groups.push({
    title: createMessage(EDITOR_PANE_TEXTS.queries_create_from_existing),
    className: "t--from-source-list",
    operations: fromExistingSources,
  });

  /** From blanks **/

  groups.push({
    title: createMessage(EDITOR_PANE_TEXTS.queries_create_new),
    className: "t--new-blank-api",
    operations: fromNewBlankAPI,
  });

  groups.map((group) => {
    const items = getListItems(group.operations);
    const lastItem = items[items.length - 1];

    if (group.title === "Datasources" && lastItem?.title === "New datasource") {
      items.splice(items.length - 1);

      const addConfig = {
        icon: lastItem.startIcon,
        onClick: lastItem.onClick,
        title: lastItem.title,
      };

      groupedItems.push({
        groupTitle: group.title,
        className: group.className,
        items,
        addConfig,
      });
    } else {
      groupedItems.push({
        groupTitle: group.title || "",
        className: group.className,
        items,
      });
    }
  });

  return groupedItems;
};
