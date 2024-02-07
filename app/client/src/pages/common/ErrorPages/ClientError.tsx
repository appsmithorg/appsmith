import React from "react";
import { useDispatch } from "react-redux";
import { Button } from "design-system";
import { getAppsmithConfigs } from "@appsmith/configs";
import Page from "./Page";
import {
  createMessage,
  PAGE_CLIENT_ERROR_DESCRIPTION,
  PAGE_CLIENT_ERROR_TITLE,
} from "@appsmith/constants/messages";

const { intercomAppID } = getAppsmithConfigs();

function ClientError() {
  const dispatch = useDispatch();

  return (
    <Page
      cta={
        intercomAppID && (
          <Button
            className="button-position"
            endIcon="right-arrow"
            kind="primary"
            onClick={() => window.Intercom && window.Intercom('show')}
            size="md"
          >
            Chat with us on Intercom
          </Button>
        )
      }
      description={createMessage(PAGE_CLIENT_ERROR_DESCRIPTION)}
      title={createMessage(PAGE_CLIENT_ERROR_TITLE)}
    />
  );
}

export default ClientError;
