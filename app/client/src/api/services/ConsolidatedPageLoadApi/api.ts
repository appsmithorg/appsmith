import { api } from "api/core";
import { CONSOLIDATED_API_TIMEOUT_MS } from "ee/constants/ApiConstants";
import type { InitConsolidatedApi } from "sagas/InitSagas";
import type { ConsolidatedApiParams } from "./types";
import { ConsolidatedApiUtils } from "./url";

export const getConsolidatedPageLoadDataView = async (
  params: ConsolidatedApiParams,
) => {
  const viewUrl = ConsolidatedApiUtils.getViewUrl(params);

  return api.get<InitConsolidatedApi>(viewUrl, {
    timeout: CONSOLIDATED_API_TIMEOUT_MS,
  });
};

export const getConsolidatedPageLoadDataEdit = async (
  params: ConsolidatedApiParams,
) => {
  const editUrl = ConsolidatedApiUtils.getEditUrl(params);

  return api.get<InitConsolidatedApi>(editUrl, {
    timeout: CONSOLIDATED_API_TIMEOUT_MS,
  });
};
