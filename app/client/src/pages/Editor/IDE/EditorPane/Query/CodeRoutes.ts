import {
  ADD_PATH,
  API_EDITOR_ID_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  CURL_IMPORT_PAGE_PATH,
} from "@appsmith/constants/routes/appRoutes";
import ApiEditor from "pages/Editor/APIEditor";
import QueryEditor from "pages/Editor/QueryEditor";
import { SAAS_EDITOR_API_ID_PATH } from "pages/Editor/SaaSEditor/constants";
import CurlImportEditor from "pages/Editor/APIEditor/CurlImportEditor";
import AddQuery from "./Add";
import { BlankStateContainer } from "./BlankStateContainer";

export const CodeRoutes = (path: string) => [
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
    component: BlankStateContainer,
    exact: true,
    path: [path],
  },
];
