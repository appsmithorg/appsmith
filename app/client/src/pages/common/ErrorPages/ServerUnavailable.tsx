import React from "react";
import { Button, Size } from "design-system";

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
          category="primary"
          className="button-position"
          fill="true"
          onClick={() => window.location.reload()}
          size={Size.large}
          tag="button"
          text={"Retry"}
          variant="info"
        />
      }
      description={createMessage(PAGE_SERVER_UNAVAILABLE_DESCRIPTION)}
      errorCode={createMessage(PAGE_SERVER_UNAVAILABLE_ERROR_CODE)}
      title={createMessage(PAGE_SERVER_UNAVAILABLE_TITLE)}
    />
  );
}

export default ServerUnavailable;
