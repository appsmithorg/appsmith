import React from "react";

import { getAppsmithConfigs } from "ee/configs";
import { createMessage } from "ee/constants/messages";
import {
  PAGE_SERVER_UNAVAILABLE_ERROR_CODE,
  PAGE_SERVER_UNAVAILABLE_ERROR_MESSAGES,
  PAGE_SERVER_UNAVAILABLE_TITLE,
} from "ee/constants/messages";

import { Button } from "@appsmith/ads";

import Page from "./Page";

const { cloudHosting } = getAppsmithConfigs();

function ServerUnavailable() {
  return (
    <Page
      cta={
        <Button
          className="button-position"
          kind="primary"
          onClick={() => window.location.reload()}
          size="md"
        >
          Retry
        </Button>
      }
      errorCode={createMessage(PAGE_SERVER_UNAVAILABLE_ERROR_CODE)}
      errorMessages={PAGE_SERVER_UNAVAILABLE_ERROR_MESSAGES(!!cloudHosting)}
      title={createMessage(PAGE_SERVER_UNAVAILABLE_TITLE, !!cloudHosting)}
    />
  );
}

export default ServerUnavailable;
