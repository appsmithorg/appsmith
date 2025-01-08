import type { APP_MODE } from "entities/App";
import type { PageLayout, FetchPageResponse, UpdatePageRequest } from "api/PageApi";
import type { CanvasWidgetsReduxState } from "reducers/types/canvasWidgets.types";
import type { DSLWidget } from "WidgetProvider/constants";
import type { PageAction, LayoutOnLoadActionErrors } from "constants/AppsmithActionConstants/ActionConstants";
import type { ApiResponse } from "api/ApiResponses";
import type { PACKAGE_PULL_STATUS } from "ee/constants/ModuleConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { WidgetType } from "constants/WidgetConstants";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";

export interface FetchPageListPayload {
  applicationId: string;
  mode: APP_MODE;
}

export interface UpdateLayoutOptions {
  isRetry?: boolean;
  shouldReplay?: boolean;
  updatedWidgetIds?: string[];
}

export interface FetchPageActionPayload {
  id: string;
  isFirstLoad?: boolean;
  pageWithMigratedDsl?: FetchPageResponse;
}

export interface UpdateCurrentPagePayload {
  id: string;
  slug?: string;
  permissions?: string[];
}

export interface UpdateCanvasPayload {
  pageWidgetId: string;
  widgets: { [widgetId: string]: WidgetProps };
  currentLayoutId: string;
  currentPageId: string;
  currentPageName: string;
  currentApplicationId: string;
  dsl: Partial<DSLWidget>;
  pageActions: PageAction[][];
  updatedWidgetIds?: string[];
  layoutOnLoadActionErrors?: LayoutOnLoadActionErrors[];
}

export interface CreatePageActionPayload {
  applicationId: string;
  name: string;
  layouts: Partial<PageLayout>[];
}

export interface ClonePageActionPayload {
  id: string;
  blockNavigation?: boolean;
}

export interface ClonePageSuccessPayload {
  pageName: string;
  description?: string;
  pageId: string;
  basePageId: string;
  layoutId: string;
  isDefault: boolean;
  slug: string;
}

export interface SetupPageActionPayload {
  id: string;
  isFirstLoad?: boolean;
  pageWithMigratedDsl?: FetchPageResponse;
  packagePullStatus?: ApiResponse<PACKAGE_PULL_STATUS>;
}

export interface FetchPublishedPageActionPayload {
  pageId: string;
  bustCache?: boolean;
  pageWithMigratedDsl?: FetchPageResponse;
}

export interface FetchPublishedPageResourcesPayload {
  pageId: string;
  basePageId: string;
}

export interface UpdatePageErrorPayload {
  request: UpdatePageRequest;
  error: unknown;
}

export interface WidgetAddChild {
  widgetId: string;
  widgetName?: string;
  type: WidgetType;
  leftColumn: number;
  topRow: number;
  columns: number;
  rows: number;
  parentRowSpace: number;
  parentColumnSpace: number;
  newWidgetId: string;
  tabId: string;
  props?: Record<string, unknown>;
  dynamicBindingPathList?: DynamicPath[];
}

export interface WidgetRemoveChild {
  widgetId: string;
  childWidgetId: string;
}

export interface WidgetDelete {
  widgetId?: string;
  parentId?: string;
  disallowUndo?: boolean;
  isShortcut?: boolean;
}

export interface MultipleWidgetDeletePayload {
  widgetIds: string[];
  disallowUndo?: boolean;
  isShortcut?: boolean;
}

export interface WidgetResize {
  widgetId: string;
  parentId: string;
  leftColumn?: number;
  rightColumn?: number;
  topRow?: number;
  bottomRow?: number;
  mobileLeftColumn?: number;
  mobileRightColumn?: number;
  mobileTopRow?: number;
  mobileBottomRow?: number;
  snapColumnSpace: number;
  snapRowSpace: number;
}

export interface ModalWidgetResize {
  height: number;
  width: number;
  widgetId: string;
  canvasWidgetId: string;
}

export interface WidgetAddChildren {
  widgetId: string;
  children: Array<{
    type: WidgetType;
    widgetId: string;
    parentId: string;
    parentRowSpace: number;
    parentColumnSpace: number;
    leftColumn: number;
    rightColumn: number;
    topRow: number;
    bottomRow: number;
    isLoading: boolean;
  }>;
}

export interface WidgetUpdateProperty {
  widgetId: string;
  propertyPath: string;
  propertyValue: unknown;
}

export interface ReduxActionWithExtraParams<T> extends ReduxAction<T> {
  extraParams: Record<string, unknown>;
}

export interface GenerateCRUDSuccess {
  page: {
    layouts: Array<Partial<PageLayout>>;
    id: string;
    baseId: string;
    name: string;
    isDefault?: boolean;
    slug: string;
    description?: string;
  };
  isNewPage: boolean;
}

export interface GenerateTemplatePageActionPayload {
  pageId: string;
  tableName: string;
  datasourceId: string;
  applicationId: string;
  columns?: string[];
  searchColumn?: string;
  mode?: string;
  pluginSpecificParams?: Record<string, unknown>;
}

export interface DeletePageActionPayload {
  id: string;
}

export interface SetDefaultPageActionPayload {
  id: string;
  applicationId: string;
}

export interface SetPageOrderActionPayload {
  pageId: string;
  order: number;
  applicationId: string;
}

export interface SetupPageActionPayload {
  id: string;
  isFirstLoad?: boolean;
  pageWithMigratedDsl?: FetchPageResponse;
  packagePullStatus?: ApiResponse<PACKAGE_PULL_STATUS>;
}

export interface SetupPublishedPageActionPayload {
  pageId: string;
  bustCache: boolean;
  pageWithMigratedDsl?: FetchPageResponse;
}
