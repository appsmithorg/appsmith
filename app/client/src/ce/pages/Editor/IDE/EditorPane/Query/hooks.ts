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
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import {
  ADD_PATH,
  API_EDITOR_ID_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  CURL_IMPORT_PAGE_PATH,
} from "@appsmith/constants/routes/appRoutes";
import { SAAS_EDITOR_API_ID_PATH } from "pages/Editor/SaaSEditor/constants";
import ApiEditor from "pages/Editor/APIEditor";
import type { UseRoutes } from "@appsmith/entities/IDE/constants";
import {
  EditorEntityTabState,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import QueryEditor from "pages/Editor/QueryEditor";
import AddQuery from "pages/Editor/IDE/EditorPane/Query/Add";
import ListQuery from "pages/Editor/IDE/EditorPane/Query/List";
import type { AppState } from "@appsmith/reducers";
import keyBy from "lodash/keyBy";
import { getPluginEntityIcon } from "pages/Editor/Explorer/ExplorerIcons";
import type { ListItemProps } from "design-system";
import { useCurrentEditorState } from "pages/Editor/IDE/hooks";
import CurlImportEditor from "pages/Editor/APIEditor/CurlImportEditor";

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

export const useQuerySegmentRoutes = (path: string): UseRoutes => {
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const editorMode = useSelector(getIDEViewMode);

  if (isSideBySideEnabled && editorMode === EditorViewMode.SplitScreen) {
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
        path: [`${path}${ADD_PATH}`, `${path}/:queryId${ADD_PATH}`],
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
        key: "CurlImportEditor",
        component: CurlImportEditor,
        exact: true,
        path: [
          BUILDER_PATH + CURL_IMPORT_PAGE_PATH,
          BUILDER_CUSTOM_PATH + CURL_IMPORT_PAGE_PATH,
          BUILDER_PATH_DEPRECATED + CURL_IMPORT_PAGE_PATH,
          BUILDER_PATH + CURL_IMPORT_PAGE_PATH + ADD_PATH,
          BUILDER_CUSTOM_PATH + CURL_IMPORT_PAGE_PATH + ADD_PATH,
          BUILDER_PATH_DEPRECATED + CURL_IMPORT_PAGE_PATH + ADD_PATH,
        ],
      },
      {
        key: "QueryEditor",
        component: QueryEditor,
        exact: true,
        path: [path + "/:queryId"],
      },
      {
        key: "QueryEmpty",
        component: ListQuery,
        exact: true,
        path: [path],
      },
    ];
  }
  return [
    {
      key: "AddQuery",
      exact: true,
      component: AddQuery,
      path: [`${path}${ADD_PATH}`, `${path}/:queryId${ADD_PATH}`],
    },
    {
      key: "ListQuery",
      exact: false,
      component: ListQuery,
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
