import { SIGNPOSTING_STEP } from "./Utils";

//Hide Anonymous Data Popup after 15 seconds
export const ANONYMOUS_DATA_POPOP_TIMEOUT = 15000;

//Telemetry Docs Page
export const TELEMETRY_DOCS_PAGE_URL =
  "https://docs.appsmith.com/product/telemetry";

export const SIGNPOSTING_ANALYTICS_STEP_NAME = {
  [SIGNPOSTING_STEP.CONNECT_A_DATASOURCE]: "Connect to datasource",
  [SIGNPOSTING_STEP.CREATE_A_QUERY]: "Created query",
  [SIGNPOSTING_STEP.ADD_WIDGETS]: "Created Widget",
  [SIGNPOSTING_STEP.CONNECT_DATA_TO_WIDGET]: "Binding success",
  [SIGNPOSTING_STEP.DEPLOY_APPLICATIONS]: "Deployed app",
};
