import React from "react";
import { useDispatch } from "react-redux";
import { Button } from "design-system";
import { flushErrors } from "actions/errorActions";

import Page from "./Page";
import {
  createMessage,
  PAGE_CLIENT_ERROR_DESCRIPTION,
  PAGE_CLIENT_ERROR_TITLE,
} from "@appsmith/constants/messages";

function ClientError() {
  const dispatch = useDispatch();

  return (
    <Page
      cta={
        <Button
          className="button-position"
          endIcon="right-arrow"
          kind="primary"
          onClick={() => {
            dispatch(flushErrors());
            window.open("https://discord.gg/rBTTVJp", "_blank");
          }}
          size="md"
        >
          Contact us on discord
        </Button>
      }
      description={createMessage(PAGE_CLIENT_ERROR_DESCRIPTION)}
      title={createMessage(PAGE_CLIENT_ERROR_TITLE)}
    />
  );
}

export default ClientError;
