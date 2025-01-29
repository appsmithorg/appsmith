import { api } from "api/core";
import type { InitConsolidatedApi } from "sagas/InitSagas";
import type { ConsolidatedApiParams } from "./types";
import { ConsolidatedApiUtils } from "./url";

export const getConsolidatedPageLoadDataView = async (
  params: ConsolidatedApiParams,
) => {
  const viewUrl = ConsolidatedApiUtils.getViewUrl(params);

  return api.get<InitConsolidatedApi>(viewUrl, {
    headers: {
      "x-initiated-from": "main-thread",
    },
  });
};

export const getConsolidatedPageLoadDataEdit = async (
  params: ConsolidatedApiParams,
) => {
  const editUrl = ConsolidatedApiUtils.getEditUrl(params);

  return api.get<InitConsolidatedApi>(editUrl, {
    headers: {
      "x-initiated-from": "main-thread",
    },
  });
};
