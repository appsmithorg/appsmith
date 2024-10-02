import { api } from "api/core";
import type { InitConsolidatedApi } from "sagas/InitSagas";

const BASE_URL = "v1/consolidated-api";
const VIEW_URL = `${BASE_URL}/view`;
const EDIT_URL = `${BASE_URL}/edit`;

export const getConsolidatedPageLoadDataView = async (params: {
  applicationId?: string;
  defaultPageId?: string;
}) => {
  return api.get<InitConsolidatedApi>(VIEW_URL, { params });
};

export const getConsolidatedPageLoadDataEdit = async (params: {
  applicationId?: string;
  defaultPageId?: string;
}) => {
  return api.get<InitConsolidatedApi>(EDIT_URL, { params });
};
