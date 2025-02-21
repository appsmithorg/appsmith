import type { UseRoutes } from "IDE/Interfaces/UseRoutes";
import {
  ADD_PATH,
  API_EDITOR_ID_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "ee/constants/routes/appRoutes";
import { SAAS_EDITOR_API_ID_PATH } from "pages/Editor/SaaSEditor/constants";
import PluginActionEditor from "pages/AppIDE/components/AppPluginActionEditor/loader";
import QueryAdd from "pages/AppIDE/components/QueryAdd/loader";
import QueriesBlankState from "PluginActionEditor/components/PluginActionForm/components/UQIEditor/QueriesBlankState";

export const QueryEditorRoutes = (path: string): UseRoutes => {
  return [
    {
      key: "QueryAdd",
      exact: true,
      component: QueryAdd,
      path: [`${path}${ADD_PATH}`, `${path}/:baseQueryId${ADD_PATH}`],
    },
    {
      key: "PluginActionEditor",
      component: PluginActionEditor,
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
      component: QueriesBlankState,
      exact: true,
      path: [path],
    },
  ];
};
