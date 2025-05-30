import { appsmithTelemetry } from "instrumentation";
import type { AxiosResponse } from "axios";
import { CONTENT_TYPE_HEADER_KEY } from "PluginActionEditor/constants/CommonApiConstants";

export const validateJsonResponseMeta = (response: AxiosResponse) => {
  if (
    response.headers[CONTENT_TYPE_HEADER_KEY] === "application/json" &&
    !response.data.responseMeta
  ) {
    appsmithTelemetry.captureException(
      new Error("Api responded without response meta"),
      {
        errorName: "ValidateJsonResponseMeta",
        contexts: { response: response.data },
      },
    );
  }
};
