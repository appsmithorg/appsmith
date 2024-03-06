export * from "ce/pages/Editor/IDE/EditorPane/constants";

import {
  querySegmentRoutes as CE_querySegmentRoutes,
  jsSegmentRoutes as CE_jsSegmentRoutes,
} from "ce/pages/Editor/IDE/EditorPane/constants";

import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";

export const querySegmentRoutes = [
  ...CE_querySegmentRoutes,
  `/module-instance/${MODULE_TYPE.QUERY}`,
];

export const jsSegmentRoutes = [
  ...CE_jsSegmentRoutes,
  `/module-instance/${MODULE_TYPE.JS}`,
];
