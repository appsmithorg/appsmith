import {
  lazy,
  Suspense,
  useCallback,
  useMemo,
  type MouseEvent,
  type ReactNode,
} from "react";
import React from "react";
import history from "utils/history";
import { useLocation } from "react-router";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { useDispatch, useSelector } from "react-redux";
import { useFilteredFileOperations } from "components/editorComponents/GlobalSearch/GlobalSearchHooks";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { getHasCreateActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import { getQueryUrl } from "ee/pages/Editor/IDE/EditorPane/Query/utils";
import {
  ADD_PATH,
  API_EDITOR_ID_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "ee/constants/routes/appRoutes";
import { SAAS_EDITOR_API_ID_PATH } from "pages/Editor/SaaSEditor/constants";
import type { UseRoutes } from "ee/entities/IDE/constants";
import type { AppState } from "ee/reducers";
import keyBy from "lodash/keyBy";
import { getPluginEntityIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { type ListItemProps } from "@appsmith/ads";
import { createAddClassName } from "pages/Editor/IDE/EditorPane/utils";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "ee/entities/IDE/constants";
import { setListViewActiveState } from "actions/ideActions";
import { retryPromise } from "utils/AppsmithUtils";
import Skeleton from "widgets/Skeleton";
import type { EntityItemProps } from "@appsmith/ads/src/Templates/EntityExplorer/EntityItem/EntityItem.types";

export const useQueryAdd = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const currentEntityInfo = identifyEntityFromPath(location.pathname);
  const ideViewMode = useSelector(getIDEViewMode);

  const openAddQuery = useCallback(() => {
    if (currentEntityInfo.entity === FocusEntity.QUERY_ADD) {
      if (ideViewMode === EditorViewMode.SplitScreen) {
        dispatch(setListViewActiveState(false));
      }

      return;
    }

    const url = getQueryUrl(currentEntityInfo);

    history.push(url);
  }, [currentEntityInfo, dispatch, ideViewMode]);

  const closeAddQuery = useCallback(() => {
    const url = getQueryUrl(currentEntityInfo, false);

    history.push(url);
  }, [currentEntityInfo]);

  return { openAddQuery, closeAddQuery };
};

export type GroupedAddOperations = Array<{
  title?: string;
  className: string;
  operations: ActionOperation[];
}>;

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
  const groupedItems: {
    groupTitle: string;
    className: string;
    items: ListItemProps[] | EntityItemProps[];
    addConfig?: {
      icon: ReactNode;
      title: string;
      onClick: (e: MouseEvent) => void;
    };
  }[] = [];

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

    if (group.title === "Datasources" && lastItem.title === "New datasource") {
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

const PluginActionEditor = lazy(async () =>
  retryPromise(
    async () =>
      import(
        /* webpackChunkName: "PluginActionEditor" */ "pages/Editor/AppPluginActionEditor"
      ),
  ),
);

const ApiEditor = lazy(async () =>
  retryPromise(
    async () =>
      import(/* webpackChunkName: "APIEditor" */ "pages/Editor/APIEditor"),
  ),
);

const AddQuery = lazy(async () =>
  retryPromise(
    async () =>
      import(
        /* webpackChunkName: "AddQuery" */ "pages/Editor/IDE/EditorPane/Query/Add"
      ),
  ),
);
const QueryEditor = lazy(async () =>
  retryPromise(
    async () =>
      import(/* webpackChunkName: "QueryEditor" */ "pages/Editor/QueryEditor"),
  ),
);

const QueryEmpty = lazy(async () =>
  retryPromise(
    async () =>
      import(
        /* webpackChunkName: "QueryEmpty" */ "pages/Editor/QueryEditor/QueriesBlankState"
      ),
  ),
);

export const useQueryEditorRoutes = (path: string): UseRoutes => {
  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  const skeleton = useMemo(() => <Skeleton />, []);

  const newComponents = useMemo(
    () => [
      {
        key: "AddQuery",
        exact: true,
        component: () => (
          <Suspense fallback={skeleton}>
            <AddQuery />
          </Suspense>
        ),
        path: [`${path}${ADD_PATH}`, `${path}/:baseQueryId${ADD_PATH}`],
      },
      {
        key: "PluginActionEditor",
        component: () => {
          return (
            <Suspense fallback={skeleton}>
              <PluginActionEditor />
            </Suspense>
          );
        },
        path: [
          BUILDER_PATH + API_EDITOR_ID_PATH,
          BUILDER_CUSTOM_PATH + API_EDITOR_ID_PATH,
          BUILDER_PATH_DEPRECATED + API_EDITOR_ID_PATH,
          BUILDER_PATH + SAAS_EDITOR_API_ID_PATH,
          BUILDER_CUSTOM_PATH + SAAS_EDITOR_API_ID_PATH,
          BUILDER_PATH_DEPRECATED + SAAS_EDITOR_API_ID_PATH,
          path + "/:baseQueryId",
        ],
        exact: true,
      },
      {
        key: "QueryEmpty",
        component: () => (
          <Suspense fallback={skeleton}>
            <QueryEmpty />
          </Suspense>
        ),
        exact: true,
        path: [path],
      },
    ],
    [path, skeleton],
  );

  const oldComponents = useMemo(
    () => [
      {
        key: "ApiEditor",
        component: (args: object) => {
          return (
            <Suspense fallback={skeleton}>
              <ApiEditor {...args} />
            </Suspense>
          );
        },
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
        component: () => (
          <Suspense fallback={skeleton}>
            <AddQuery />
          </Suspense>
        ),
        path: [`${path}${ADD_PATH}`, `${path}/:baseQueryId${ADD_PATH}`],
      },
      {
        key: "SAASEditor",
        component: (args: object) => {
          return (
            <Suspense fallback={skeleton}>
              <QueryEditor {...args} />
            </Suspense>
          );
        },
        exact: true,
        path: [
          BUILDER_PATH + SAAS_EDITOR_API_ID_PATH,
          BUILDER_CUSTOM_PATH + SAAS_EDITOR_API_ID_PATH,
          BUILDER_PATH_DEPRECATED + SAAS_EDITOR_API_ID_PATH,
        ],
      },
      {
        key: "QueryEditor",
        component: (args: object) => {
          return (
            <Suspense fallback={skeleton}>
              <QueryEditor {...args} />
            </Suspense>
          );
        },
        exact: true,
        path: [path + "/:baseQueryId"],
      },
      {
        key: "QueryEmpty",
        component: () => (
          <Suspense fallback={skeleton}>
            <QueryEmpty />
          </Suspense>
        ),
        exact: true,
        path: [path],
      },
    ],
    [path, skeleton],
  );

  if (isActionRedesignEnabled) {
    return newComponents;
  }

  return oldComponents;
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
        className: className,
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
