import { useCallback, useMemo } from "react";
import history from "utils/history";
import { useLocation } from "react-router";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { useDispatch, useSelector } from "react-redux";
import { useFilteredFileOperations } from "components/editorComponents/GlobalSearch/GlobalSearchHooks";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import { getQueryUrl } from "@appsmith/pages/Editor/IDE/EditorPane/Query/utils";
import { EditorEntityTabState } from "@appsmith/entities/IDE/constants";
import type { AppState } from "@appsmith/reducers";
import keyBy from "lodash/keyBy";
import { getPluginEntityIcon } from "pages/Editor/Explorer/ExplorerIcons";
import type { ListItemProps } from "design-system";
import { useCurrentEditorState } from "pages/Editor/IDE/hooks";

export const useQueryAdd = () => {
  const location = useLocation();
  const currentEntityInfo = identifyEntityFromPath(location.pathname);
  const { segmentMode } = useCurrentEditorState();

  const addButtonClickHandler = useCallback(() => {
    let url = "";
    if (segmentMode === EditorEntityTabState.Add) {
      // Already in add mode, back to the previous active item
      url = getQueryUrl(currentEntityInfo, false);
    } else {
      url = getQueryUrl(currentEntityInfo);
    }
    history.push(url);
  }, [currentEntityInfo, segmentMode]);

  return addButtonClickHandler;
};

export type GroupedAddOperations = Array<{
  title?: string;
  className: string;
  operations: ActionOperation[];
}>;

export const useGroupedAddQueryOperations = (): GroupedAddOperations => {
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const pagePermissions = useSelector(getPagePermissions);

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

  return groups;
};

export const useAddQueryListItems = () => {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId) as string;
  const plugins = useSelector((state: AppState) => {
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

  const getListItems = (data: any[]) => {
    return data.map((fileOperation) => {
      const icon =
        fileOperation.icon ||
        (fileOperation.pluginId &&
          getPluginEntityIcon(pluginGroups[fileOperation.pluginId]));
      return {
        startIcon: icon,
        title:
          fileOperation.entityExplorerTitle ||
          fileOperation.dsName ||
          fileOperation.title,
        description: !!fileOperation.isBeta ? "Beta" : "",
        descriptionType: "inline",
        onClick: onCreateItemClick.bind(null, fileOperation),
      } as ListItemProps;
    });
  };

  return { getListItems };
};
