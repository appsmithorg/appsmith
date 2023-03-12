import React from "react";
import { Button } from "design-system";

import Page from "./Page";
import {
  createMessage,
  PAGE_SERVER_UNAVAILABLE_DESCRIPTION,
  PAGE_SERVER_UNAVAILABLE_ERROR_CODE,
  PAGE_SERVER_UNAVAILABLE_TITLE,
} from "@appsmith/constants/messages";

function ServerUnavailable() {
  return (
    <Page
      cta={
        <Button
          className="button-position"
          kind="primary"
          onPress={() => window.location.reload()}
          size="md"
        >
          Retry
        </Button>
      }
      description={createMessage(PAGE_SERVER_UNAVAILABLE_DESCRIPTION)}
      errorCode={createMessage(PAGE_SERVER_UNAVAILABLE_ERROR_CODE)}
      title={createMessage(PAGE_SERVER_UNAVAILABLE_TITLE)}
    />
  );
}

export default ServerUnavailable;
