import React from "react";
import {
  ACTION_OPERATION_DESCRIPTION,
  createMessage,
  NAV_DESCRIPTION,
} from "ee/constants/messages";
import type { ValidationTypes } from "constants/WidgetValidation";
import type { Datasource } from "entities/Datasource";
import { PluginPackageName, PluginType } from "entities/Action";
import type { WidgetType } from "constants/WidgetConstants";
import type { EntityTypeValue } from "entities/DataTree/dataTreeFactory";
import { getPluginByPackageName } from "ee/selectors/entitiesSelector";
import type { AppState } from "ee/reducers";
import WidgetFactory from "WidgetProvider/factory";
import {
  CurlIconV2,
  EntityIcon,
  GraphQLIconV2,
  JsFileIconV2,
} from "pages/Editor/Explorer/ExplorerIcons";
import type { EventLocation } from "ee/utils/analyticsUtilTypes";
import { isMacOrIOS, modText, shiftText } from "utils/helpers";
import { FocusEntity } from "navigation/FocusEntity";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { Icon } from "@appsmith/ads";
import type { ActionParentEntityTypeInterface } from "ee/entities/Engine/actionHelpers";
import {
  createNewAPIBasedOnParentEntity,
  createNewJSCollectionBasedOnParentEntity,
} from "ee/actions/helpers";
import { openCurlImportModal } from "pages/Editor/CurlImport/store/curlImportActions";

export type SelectEvent =
  | React.MouseEvent
  | React.KeyboardEvent
  | KeyboardEvent
  | null;

export interface RecentEntity {
  type: FocusEntity;
  id: string;
  pageId: string;
}

export enum SEARCH_CATEGORY_ID {
  NAVIGATION = "Navigate",
  INIT = "INIT",
  ACTION_OPERATION = "Create new",
}

export enum SEARCH_ITEM_TYPES {
  action = "action",
  widget = "widget",
  datasource = "datasource",
  page = "page",
  sectionTitle = "sectionTitle",
  placeholder = "placeholder",
  jsAction = "jsAction",
  category = "category",
  actionOperation = "actionOperation",
}

export const comboHelpText = {
  [SEARCH_CATEGORY_ID.NAVIGATION]: <>{modText()} P</>,
  [SEARCH_CATEGORY_ID.INIT]: <>{modText()} K</>,
  [SEARCH_CATEGORY_ID.ACTION_OPERATION]: (
    <>
      {modText()} {shiftText()} {isMacOrIOS() ? "+" : "Plus"}
    </>
  ),
};

export interface Snippet {
  entities?: [string];
  fields?: [string];
  dataType?: string;
  language: string;
  body: SnippetBody;
}

export interface SnippetBody {
  title: string;
  snippet: string;
  isTrigger?: boolean;
  args: [SnippetArgument];
  summary: string;
  template: string;
  snippetMeta?: string;
  shortTitle?: string;
}

export type FilterEntity = WidgetType | EntityTypeValue;

export const filterEntityTypeLabels: Partial<Record<EntityTypeValue, string>> =
  {
    ACTION: "All Queries",
    WIDGET: "All Widgets",
    JSACTION: "JS Objects",
  };

export const getSnippetFilterLabel = (state: AppState, label: string) => {
  return (
    WidgetFactory.widgetConfigMap.get(label)?.widgetName ||
    getPluginByPackageName(state, label)?.name ||
    filterEntityTypeLabels[label as EntityTypeValue] ||
    label
  );
};

export interface SnippetArgument {
  identifier: string;
  name: string;
  type: ValidationTypes;
  placeholder?: boolean;
}

export interface SearchCategory {
  id: SEARCH_CATEGORY_ID;
  kind?: SEARCH_ITEM_TYPES;
  title?: string;
  desc?: string;
  show?: () => boolean;
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getOptionalFilters(optionalFilterMeta: any) {
  return Object.entries(optionalFilterMeta || {}).reduce(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (acc: Array<string>, [key, value]: any) => {
      value.forEach((value: string) => acc.push(`${key}:${value}`));

      return acc;
    },
    [],
  );
}

export const filterCategories: Record<SEARCH_CATEGORY_ID, SearchCategory> = {
  [SEARCH_CATEGORY_ID.NAVIGATION]: {
    title: "Navigate",
    kind: SEARCH_ITEM_TYPES.category,
    id: SEARCH_CATEGORY_ID.NAVIGATION,
    desc: createMessage(NAV_DESCRIPTION),
  },
  [SEARCH_CATEGORY_ID.ACTION_OPERATION]: {
    title: "Create new",
    kind: SEARCH_ITEM_TYPES.category,
    id: SEARCH_CATEGORY_ID.ACTION_OPERATION,
    desc: createMessage(ACTION_OPERATION_DESCRIPTION),
  },
  [SEARCH_CATEGORY_ID.INIT]: {
    id: SEARCH_CATEGORY_ID.INIT,
  },
};

export const isNavigation = (category: SearchCategory) =>
  category.id === SEARCH_CATEGORY_ID.NAVIGATION;
export const isMenu = (category: SearchCategory) =>
  category.id === SEARCH_CATEGORY_ID.INIT;
export const isActionOperation = (category: SearchCategory) =>
  category.id === SEARCH_CATEGORY_ID.ACTION_OPERATION;

export const getFilterCategoryList = () =>
  Object.values(filterCategories).filter((cat: SearchCategory) => {
    return cat.show ? cat.show() : true;
  });

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SearchItem = Datasource | any;

// todo better checks here?
export const getItemType = (item: SearchItem): SEARCH_ITEM_TYPES => {
  let type: SEARCH_ITEM_TYPES;

  if (item.widgetName) type = SEARCH_ITEM_TYPES.widget;
  else if (
    item.kind === SEARCH_ITEM_TYPES.page ||
    item.kind === SEARCH_ITEM_TYPES.sectionTitle ||
    item.kind === SEARCH_ITEM_TYPES.placeholder ||
    item.kind === SEARCH_ITEM_TYPES.category ||
    item.kind === SEARCH_ITEM_TYPES.actionOperation
  )
    type = item.kind;
  else if (item.config?.pluginType === PluginType.JS)
    type = SEARCH_ITEM_TYPES.jsAction;
  else if (item.config?.name) type = SEARCH_ITEM_TYPES.action;
  else type = SEARCH_ITEM_TYPES.datasource;

  return type;
};

export const getItemTitle = (item: SearchItem): string => {
  const type = getItemType(item);

  switch (type) {
    case SEARCH_ITEM_TYPES.action:
    case SEARCH_ITEM_TYPES.jsAction:
      return item?.config?.name;
    case SEARCH_ITEM_TYPES.widget:
      return item?.widgetName;
    case SEARCH_ITEM_TYPES.datasource:
      return item?.name;
    case SEARCH_ITEM_TYPES.page:
      return item?.pageName;
    case SEARCH_ITEM_TYPES.sectionTitle:
    case SEARCH_ITEM_TYPES.placeholder:
      return item?.title;
    case SEARCH_ITEM_TYPES.actionOperation:
      return item.title;
    default:
      return "";
  }
};

export const getItemPage = (item: SearchItem): string => {
  const type = getItemType(item);

  switch (type) {
    case SEARCH_ITEM_TYPES.action:
    case SEARCH_ITEM_TYPES.jsAction:
      return item?.config?.pageId;
    case SEARCH_ITEM_TYPES.widget:
    case SEARCH_ITEM_TYPES.page:
      return item?.pageId;
    default:
      return "";
  }
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const attachKind = (source: any[], kind: string) => {
  return source.map((s) => ({
    ...s,
    kind,
  }));
};

export const getEntityId = (entity: {
  entityType: FocusEntity;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}) => {
  const { entityType } = entity;

  switch (entityType) {
    case FocusEntity.DATASOURCE:
      return entity.id;
    case FocusEntity.API:
    case FocusEntity.QUERY:
    case FocusEntity.JS_OBJECT:
      return entity.config?.id;
    case FocusEntity.PROPERTY_PANE:
      return entity.widgetId;
    case FocusEntity.CANVAS:
    case FocusEntity.EDITOR:
      return entity.pageId;
    case FocusEntity.NONE:
      break;
  }
};

export interface ActionOperation {
  title: string;
  desc: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  kind: SEARCH_ITEM_TYPES;
  action?: (
    entityId: string,
    location: EventLocation,
    entityType?: ActionParentEntityTypeInterface,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  redirect?: (entityId: string, location: EventLocation) => any;
  pluginId?: string;
  focusEntityType?: FocusEntity;
  dsName?: string;
  entityExplorerTitle?: string;
  isBeta?: boolean;
  tooltip?: string;
}

export const actionOperations: ActionOperation[] = [
  {
    title: "New blank API",
    entityExplorerTitle: "REST API",
    desc: "Create a new API",
    kind: SEARCH_ITEM_TYPES.actionOperation,
    action: (
      entityId: string,
      location: EventLocation,
      entityType?: ActionParentEntityTypeInterface,
    ) =>
      createNewAPIBasedOnParentEntity(
        entityId,
        location,
        undefined,
        entityType,
      ),
    focusEntityType: FocusEntity.API,
  },
  {
    title: "New blank GraphQL API",
    entityExplorerTitle: "GraphQL API",
    desc: "Create a new API",
    icon: <GraphQLIconV2 />,
    kind: SEARCH_ITEM_TYPES.actionOperation,
    action: (
      entityId: string,
      location: EventLocation,
      entityType?: ActionParentEntityTypeInterface,
    ) =>
      createNewAPIBasedOnParentEntity(
        entityId,
        location,
        PluginPackageName.GRAPHQL,
        entityType,
      ),
    focusEntityType: FocusEntity.API,
  },
  {
    title: "New JS Object",
    entityExplorerTitle: "Import from cURL",
    desc: "Create a new JS Object",
    kind: SEARCH_ITEM_TYPES.actionOperation,
    icon: JsFileIconV2(),
    action: (
      entityId: string,
      from: EventLocation,
      entityType?: ActionParentEntityTypeInterface,
    ) => createNewJSCollectionBasedOnParentEntity(entityId, from, entityType),
    focusEntityType: FocusEntity.JS_OBJECT,
  },
  {
    title: "New cURL import",
    desc: "Import a cURL Request",
    kind: SEARCH_ITEM_TYPES.actionOperation,
    icon: <CurlIconV2 />,
    action: () => openCurlImportModal(),
    focusEntityType: FocusEntity.API,
  },
];

export const createQueryOption = {
  desc: "",
  title: "Create a query",
  kind: SEARCH_ITEM_TYPES.sectionTitle,
  focusEntityType: FocusEntity.QUERY,
};

export const generateCreateQueryForDSOption = (
  ds: Datasource,
  onClick: (entityId: string, from: EventLocation) => void,
) => {
  return {
    title: `New ${ds.name} query`,
    shortTitle: `${ds.name} query`,
    desc: `Create a query in ${ds.name}`,
    pluginId: ds.pluginId,
    kind: SEARCH_ITEM_TYPES.actionOperation,
    action: onClick,
    focusEntityType: FocusEntity.QUERY,
    dsName: ds.name,
  };
};

export const generateCreateNewDSOption = (
  filteredFileOperations: ActionOperation[],
  onRedirect: (id: string) => void,
) => {
  return [
    ...filteredFileOperations,
    {
      desc: "Create a new datasource in the workspace",
      title: "New datasource",
      icon: (
        <EntityIcon>
          <Icon name="plus" size="lg" />
        </EntityIcon>
      ),
      kind: SEARCH_ITEM_TYPES.actionOperation,
      redirect: (id: string, entryPoint: string) => {
        onRedirect(id);
        // Event for datasource creation click
        AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
          entryPoint,
        });
      },
      focusEntityType: FocusEntity.DATASOURCE,
    },
  ];
};

export const isMatching = (text = "", query = "") => {
  if (typeof text === "string" && typeof query === "string") {
    return text.toLowerCase().indexOf(query.toLowerCase()) > -1;
  }

  return false;
};
