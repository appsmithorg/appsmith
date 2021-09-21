import {
  SAAS_EDITOR_PATH,
  SAAS_EDITOR_DATASOURCE_ID_PATH,
  SAAS_EDITOR_API_ID_PATH,
} from "pages/Editor/SaaSEditor/constants";
import ListView from "pages/Editor/SaaSEditor/ListView";
import DatasourceForm from "pages/Editor/SaaSEditor/DatasourceForm";
import ActionForm from "pages/Editor/SaaSEditor/ActionForm";

export const SaaSEditorRoutes = [
  {
    path: SAAS_EDITOR_PATH,
    component: ListView,
  },
  {
    path: SAAS_EDITOR_DATASOURCE_ID_PATH,
    component: DatasourceForm,
  },
  {
    path: SAAS_EDITOR_API_ID_PATH,
    component: ActionForm,
  },
];
