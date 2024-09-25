import * as Sentry from "@sentry/react";
import type { AxiosResponse } from "axios";
import { CONTENT_TYPE_HEADER_KEY } from "constants/ApiEditorConstants/CommonApiConstants";

export const validateJsonResponseMeta = (response: AxiosResponse) => {
  if (
    response.headers[CONTENT_TYPE_HEADER_KEY] === "application/json" &&
    !response.data.responseMeta
  ) {
    Sentry.captureException(new Error("Api responded without response meta"), {
      contexts: { response: response.data },
    });
  }
};
