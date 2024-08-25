import {
  API_EDITOR_BASE_PATH,
  BUILDER_PATH,
  JS_COLLECTION_EDITOR_PATH,
  QUERIES_EDITOR_BASE_PATH,
  WIDGETS_EDITOR_BASE_PATH,
} from "ee/constants/routes/appRoutes";
import { SAAS_EDITOR_PATH } from "pages/Editor/SaaSEditor/constants";

export const querySegmentRoutes = [
  API_EDITOR_BASE_PATH,
  `${SAAS_EDITOR_PATH}/api`,
  QUERIES_EDITOR_BASE_PATH,
];

export const jsSegmentRoutes = [JS_COLLECTION_EDITOR_PATH];

export const widgetSegmentRoutes = [
  // BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  // BUILDER_PATH_DEPRECATED,
  WIDGETS_EDITOR_BASE_PATH,
];
