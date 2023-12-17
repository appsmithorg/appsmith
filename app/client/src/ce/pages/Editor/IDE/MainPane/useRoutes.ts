import WidgetsEditor from "pages/Editor/WidgetsEditor";
import {
  API_EDITOR_ID_ADD_PATH,
  API_EDITOR_ID_PATH,
  APP_LIBRARIES_EDITOR_PATH,
  APP_SETTINGS_EDITOR_PATH,
  BUILDER_CHECKLIST_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  CURL_IMPORT_PAGE_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  DATA_SOURCES_EDITOR_LIST_PATH,
  GENERATE_TEMPLATE_FORM_PATH,
  INTEGRATION_EDITOR_PATH,
  JS_COLLECTION_EDITOR_PATH,
  JS_COLLECTION_ID_PATH,
  PROVIDER_TEMPLATE_PATH,
  ADD_PATH,
  QUERIES_EDITOR_BASE_PATH,
  QUERIES_EDITOR_ID_ADD_PATH,
  QUERIES_EDITOR_ID_PATH,
  WIDGETS_EDITOR_BASE_PATH,
  WIDGETS_EDITOR_ID_PATH,
} from "constants/routes";
import CreateNewDatasourceTab from "pages/Editor/IntegrationEditor/CreateNewDatasourceTab";
import IntegrationEditor from "pages/Editor/IntegrationEditor";
import OnboardingChecklist from "pages/Editor/FirstTimeUserOnboarding/Checklist";
import ApiEditor from "pages/Editor/APIEditor";
import QueryEditor from "pages/Editor/QueryEditor";
import JSEditor from "pages/Editor/JSEditor";
import CurlImportEditor from "pages/Editor/APIEditor/CurlImportEditor";
import ListView from "pages/Editor/SaaSEditor/ListView";
import {
  SAAS_EDITOR_API_ID_ADD_PATH,
  SAAS_EDITOR_API_ID_PATH,
  SAAS_EDITOR_DATASOURCE_ID_PATH,
  SAAS_EDITOR_PATH,
} from "pages/Editor/SaaSEditor/constants";
import DatasourceForm from "pages/Editor/SaaSEditor/DatasourceForm";
import DataSourceEditor from "pages/Editor/DataSourceEditor";
import DatasourceBlankState from "pages/Editor/DataSourceEditor/DatasourceBlankState";
import ProviderTemplates from "pages/Editor/APIEditor/ProviderTemplates";
import GeneratePage from "pages/Editor/GeneratePage";
import type { RouteProps } from "react-router";
import { useIsAppSidebarEnabled } from "navigation/featureFlagHooks";
import { JSBlankState } from "../../../../../pages/Editor/JSEditor/JSBlankState";
import { QueriesBlankState } from "../../../../../pages/Editor/QueryEditor/QueriesBlankState";

export interface RouteReturnType extends RouteProps {
  key: string;
}

/**
 * The hook is extended in EE, please be mindful when modifying the
 * signature; it might break the implementation in EE.
 */

function useRoutes(path: string): RouteReturnType[] {
  const isAppSidebarEnabled = useIsAppSidebarEnabled();

  return [
    {
      key: "Canvas",
      component: WidgetsEditor,
      exact: true,
      path: [
        BUILDER_PATH_DEPRECATED,
        BUILDER_PATH,
        BUILDER_CUSTOM_PATH,
        `${path}${WIDGETS_EDITOR_BASE_PATH}`,
        `${path}${WIDGETS_EDITOR_ID_PATH}`,
        `${path}${APP_LIBRARIES_EDITOR_PATH}`,
        `${path}${APP_SETTINGS_EDITOR_PATH}`,
      ],
    },
    {
      key: "Datasource Create and Active",
      component: isAppSidebarEnabled
        ? CreateNewDatasourceTab
        : IntegrationEditor,
      exact: true,
      path: `${path}${INTEGRATION_EDITOR_PATH}`,
    },
    {
      key: "OnboardingChecklist",
      component: OnboardingChecklist,
      exact: true,
      path: `${path}${BUILDER_CHECKLIST_PATH}`,
    },
    {
      key: "ApiEditor",
      component: ApiEditor,
      exact: true,
      path: [
        `${path}${API_EDITOR_ID_PATH}`,
        `${path}${API_EDITOR_ID_ADD_PATH}`,
      ],
    },
    {
      key: "QueryEditorList",
      component: QueriesBlankState,
      exact: true,
      path: [
        `${path}${QUERIES_EDITOR_BASE_PATH}`,
        `${path}${QUERIES_EDITOR_BASE_PATH}${ADD_PATH}`,
      ],
    },
    {
      key: "QueryEditor",
      component: QueryEditor,
      exact: true,
      path: [
        `${path}${QUERIES_EDITOR_ID_PATH}`,
        `${path}${QUERIES_EDITOR_ID_ADD_PATH}`,
      ],
    },
    {
      key: "JSEditorList",
      component: JSBlankState,
      exact: true,
      path: `${path}${JS_COLLECTION_EDITOR_PATH}`,
    },
    {
      key: "JSEditor File",
      component: JSEditor,
      exact: true,
      path: `${path}${JS_COLLECTION_ID_PATH}`,
    },
    {
      key: "CurlImportEditor",
      component: CurlImportEditor,
      exact: true,
      path: [
        `${path}${CURL_IMPORT_PAGE_PATH}`,
        `${path}${CURL_IMPORT_PAGE_PATH}${ADD_PATH}`,
      ],
    },
    {
      key: "SAASList",
      component: ListView,
      exact: true,
      path: `${path}${SAAS_EDITOR_PATH}`,
    },
    {
      key: "SAASDatasourceEditor",
      component: DatasourceForm,
      exact: true,
      path: `${path}${SAAS_EDITOR_DATASOURCE_ID_PATH}`,
    },
    {
      key: "SAASEditor",
      component: QueryEditor,
      exact: true,
      path: [
        `${path}${SAAS_EDITOR_API_ID_PATH}`,
        `${path}${SAAS_EDITOR_API_ID_ADD_PATH}`,
      ],
    },
    {
      key: "DatasourceEditor",
      component: DataSourceEditor,
      exact: true,
      path: `${path}${DATA_SOURCES_EDITOR_ID_PATH}`,
    },
    {
      key: "DatasourceBlankState",
      component: DatasourceBlankState,
      exact: true,
      path: `${path}${DATA_SOURCES_EDITOR_LIST_PATH}`,
    },
    {
      key: "ProviderTemplates",
      component: ProviderTemplates,
      exact: true,
      path: `${path}${PROVIDER_TEMPLATE_PATH}`,
    },
    {
      key: "GeneratePage",
      component: GeneratePage,
      exact: true,
      path: `${path}${GENERATE_TEMPLATE_FORM_PATH}`,
    },
  ];
}

export default useRoutes;
