import {
  SAAS_EDITOR_DATASOURCE_ID_URL,
  SAAS_EDITOR_API_ID_URL,
} from "pages/Editor/SaaSEditor/constants";
import DatasourceForm from "pages/Editor/SaaSEditor/DatasourceForm";
import ActionForm from "pages/Editor/SaaSEditor/ActionForm";

export const SaaSEditorRoutes = [
  {
    path: SAAS_EDITOR_DATASOURCE_ID_URL(),
    component: DatasourceForm,
  },
  {
    path: SAAS_EDITOR_API_ID_URL(),
    component: ActionForm,
  },
];
