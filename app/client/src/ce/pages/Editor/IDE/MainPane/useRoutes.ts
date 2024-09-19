import WidgetsEditor from "pages/Editor/WidgetsEditor";
import {
  ADD_PATH,
  API_EDITOR_ID_ADD_PATH,
  API_EDITOR_ID_PATH,
  APP_LIBRARIES_EDITOR_PATH,
  APP_SETTINGS_EDITOR_PATH,
  BUILDER_CHECKLIST_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  DATA_SOURCES_EDITOR_ID_PATH,
  DATA_SOURCES_EDITOR_LIST_PATH,
  GENERATE_TEMPLATE_FORM_PATH,
  INTEGRATION_EDITOR_PATH,
  JS_COLLECTION_EDITOR_PATH,
  JS_COLLECTION_ID_PATH,
  LIST_PATH,
  QUERIES_EDITOR_BASE_PATH,
  QUERIES_EDITOR_ID_ADD_PATH,
  QUERIES_EDITOR_ID_PATH,
  WIDGETS_EDITOR_BASE_PATH,
  WIDGETS_EDITOR_ID_PATH,
} from "constants/routes";
import CreateNewDatasourceTab from "pages/Editor/IntegrationEditor/CreateNewDatasourceTab";
import OnboardingChecklist from "pages/Editor/FirstTimeUserOnboarding/Checklist";
import {
  SAAS_EDITOR_API_ID_ADD_PATH,
  SAAS_EDITOR_API_ID_PATH,
  SAAS_EDITOR_DATASOURCE_ID_PATH,
  SAAS_EDITOR_PATH,
} from "pages/Editor/SaaSEditor/constants";
import DatasourceForm from "pages/Editor/SaaSEditor/DatasourceForm";
import DataSourceEditor from "pages/Editor/DataSourceEditor";
import DatasourceBlankState from "pages/Editor/DataSourceEditor/DatasourceBlankState";
import GeneratePage from "pages/Editor/GeneratePage";
import type { RouteProps } from "react-router";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";

export interface RouteReturnType extends RouteProps {
  key: string;
}

/**
 * The hook is extended in EE, please be mindful when modifying the
 * signature; it might break the implementation in EE.
 */

function useRoutes(path: string): RouteReturnType[] {
  const isPreviewMode = useSelector(combinedPreviewModeSelector);

  return [
    {
      key: "Canvas",
      component: WidgetsEditor,
      exact: true,
      path: [
        BUILDER_PATH_DEPRECATED,
        BUILDER_PATH,
        BUILDER_CUSTOM_PATH,
        `${BUILDER_PATH_DEPRECATED}${ADD_PATH}`,
        `${BUILDER_PATH}${ADD_PATH}`,
        `${BUILDER_CUSTOM_PATH}${ADD_PATH}`,
        `${path}${ADD_PATH}`,
        `${path}${WIDGETS_EDITOR_BASE_PATH}`,
        `${path}${WIDGETS_EDITOR_ID_PATH}`,
        `${path}${WIDGETS_EDITOR_ID_PATH}${ADD_PATH}`,
        `${path}${API_EDITOR_ID_PATH}`,
        `${path}${API_EDITOR_ID_PATH}${LIST_PATH}`,
        `${path}${API_EDITOR_ID_ADD_PATH}`,
        `${path}${QUERIES_EDITOR_BASE_PATH}`,
        `${path}${QUERIES_EDITOR_BASE_PATH}${ADD_PATH}`,
        `${path}${QUERIES_EDITOR_ID_PATH}`,
        `${path}${QUERIES_EDITOR_ID_ADD_PATH}`,
        `${path}${QUERIES_EDITOR_ID_PATH}${LIST_PATH}`,
        `${path}${JS_COLLECTION_EDITOR_PATH}`,
        `${path}${JS_COLLECTION_EDITOR_PATH}${ADD_PATH}`,
        `${path}${JS_COLLECTION_ID_PATH}`,
        `${path}${JS_COLLECTION_ID_PATH}${LIST_PATH}`,
        `${path}${SAAS_EDITOR_PATH}`,
        `${path}${SAAS_EDITOR_API_ID_PATH}`,
        `${path}${SAAS_EDITOR_API_ID_ADD_PATH}`,
        `${path}${APP_LIBRARIES_EDITOR_PATH}`,
        `${path}${APP_SETTINGS_EDITOR_PATH}`,
      ],
    },
    {
      key: "Datasource Create and Active",
      component: isPreviewMode ? WidgetsEditor : CreateNewDatasourceTab,
      exact: true,
      path: `${path}${INTEGRATION_EDITOR_PATH}`,
    },
    {
      key: "OnboardingChecklist",
      component: isPreviewMode ? WidgetsEditor : OnboardingChecklist,
      exact: true,
      path: `${path}${BUILDER_CHECKLIST_PATH}`,
    },
    {
      key: "DatasourceEditor",
      component: isPreviewMode ? WidgetsEditor : DataSourceEditor,
      exact: true,
      path: `${path}${DATA_SOURCES_EDITOR_ID_PATH}`,
    },
    {
      key: "DatasourceBlankState",
      component: isPreviewMode ? WidgetsEditor : DatasourceBlankState,
      exact: true,
      path: `${path}${DATA_SOURCES_EDITOR_LIST_PATH}`,
    },
    {
      key: "SAASDatasourceEditor",
      component: isPreviewMode ? WidgetsEditor : DatasourceForm,
      exact: true,
      path: `${path}${SAAS_EDITOR_DATASOURCE_ID_PATH}`,
    },
    {
      key: "GeneratePage",
      component: isPreviewMode ? WidgetsEditor : GeneratePage,
      exact: true,
      path: `${path}${GENERATE_TEMPLATE_FORM_PATH}`,
    },
  ];
}

export default useRoutes;
