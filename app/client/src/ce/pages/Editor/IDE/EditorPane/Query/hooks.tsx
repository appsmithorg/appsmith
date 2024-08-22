import { useCallback, useMemo } from "react";

import { useFilteredFileOperations } from "components/editorComponents/GlobalSearch/GlobalSearchHooks";
import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";
import {
  ADD_PATH,
  API_EDITOR_ID_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "ee/constants/routes/appRoutes";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { UseRoutes } from "ee/entities/IDE/constants";
import { getQueryUrl } from "ee/pages/Editor/IDE/EditorPane/Query/utils";
import type { AppState } from "ee/reducers";
import { getHasCreateActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import keyBy from "lodash/keyBy";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import ApiEditor from "pages/Editor/APIEditor";
import { getPluginEntityIcon } from "pages/Editor/Explorer/ExplorerIcons";
import AddQuery from "pages/Editor/IDE/EditorPane/Query/Add";
import { createAddClassName } from "pages/Editor/IDE/EditorPane/utils";
import QueryEditor from "pages/Editor/QueryEditor";
import { QueriesBlankState } from "pages/Editor/QueryEditor/QueriesBlankState";
import { SAAS_EDITOR_API_ID_PATH } from "pages/Editor/SaaSEditor/constants";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import {
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import history from "utils/history";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

import type { ListItemProps } from "@appsmith/ads";

export const useQueryAdd = () => {
  const location = useLocation();
  const currentEntityInfo = identifyEntityFromPath(location.pathname);

  const openAddQuery = useCallback(() => {
    if (currentEntityInfo.entity === FocusEntity.QUERY_ADD) {
      return;
    }
    let url = "";
    url = getQueryUrl(currentEntityInfo);
    history.push(url);
  }, [currentEntityInfo]);

  const closeAddQuery = useCallback(() => {
    let url = "";
    url = getQueryUrl(currentEntityInfo, false);
    history.push(url);
  }, [currentEntityInfo]);

  return { openAddQuery, closeAddQuery };
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

export const useQueryEditorRoutes = (path: string): UseRoutes => {
  return [
    {
      key: "ApiEditor",
      component: ApiEditor,
      exact: true,
      path: [
        BUILDER_PATH + API_EDITOR_ID_PATH,
        BUILDER_CUSTOM_PATH + API_EDITOR_ID_PATH,
        BUILDER_PATH_DEPRECATED + API_EDITOR_ID_PATH,
      ],
    },
    {
      key: "AddQuery",
      exact: true,
      component: AddQuery,
      path: [`${path}${ADD_PATH}`, `${path}/:baseQueryId${ADD_PATH}`],
    },
    {
      key: "SAASEditor",
      component: QueryEditor,
      exact: true,
      path: [
        BUILDER_PATH + SAAS_EDITOR_API_ID_PATH,
        BUILDER_CUSTOM_PATH + SAAS_EDITOR_API_ID_PATH,
        BUILDER_PATH_DEPRECATED + SAAS_EDITOR_API_ID_PATH,
      ],
    },
    {
      key: "QueryEditor",
      component: QueryEditor,
      exact: true,
      path: [path + "/:baseQueryId"],
    },
    {
      key: "QueryEmpty",
      component: QueriesBlankState,
      exact: true,
      path: [path],
    },
  ];
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

  const getListItems = (data: ActionOperation[]) => {
    return data.map((fileOperation) => {
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
      return {
        startIcon: icon,
        wrapperClassName: className,
        title,
        description:
          fileOperation.focusEntityType === FocusEntity.QUERY_MODULE_INSTANCE
            ? fileOperation.dsName
            : "",
        descriptionType: "inline",
        onClick: onCreateItemClick.bind(null, fileOperation),
      } as ListItemProps;
    });
  };

  return { getListItems };
};
