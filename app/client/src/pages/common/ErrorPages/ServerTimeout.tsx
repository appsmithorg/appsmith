import React from "react";
import { Button } from "@appsmith/ads";

import Page from "./Page";
import {
  createMessage,
  PAGE_SERVER_TIMEOUT_DESCRIPTION,
  PAGE_SERVER_TIMEOUT_ERROR_CODE,
  PAGE_SERVER_TIMEOUT_TITLE,
} from "ee/constants/messages";

function ServerTimeout() {
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
      description={createMessage(PAGE_SERVER_TIMEOUT_DESCRIPTION)}
      errorCode={createMessage(PAGE_SERVER_TIMEOUT_ERROR_CODE)}
      title={createMessage(PAGE_SERVER_TIMEOUT_TITLE)}
    />
  );
}

export default ServerTimeout;
