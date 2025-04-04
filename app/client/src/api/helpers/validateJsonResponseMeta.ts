import { faro } from "@grafana/faro-react";
import type { AxiosResponse } from "axios";
import { CONTENT_TYPE_HEADER_KEY } from "PluginActionEditor/constants/CommonApiConstants";

export const validateJsonResponseMeta = (response: AxiosResponse) => {
  if (
    response.headers[CONTENT_TYPE_HEADER_KEY] === "application/json" &&
    !response.data.responseMeta
  ) {
    faro?.api.pushError(
      {
        ...new Error("Api responded without response meta"),
        name: "API_RESPONSE_META_MISSING",
      },
      {
        type: "error",
        context: { response: response.data },
      },
    );
  }
};
