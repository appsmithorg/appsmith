import React from "react";

import { flushErrors } from "actions/errorActions";
import { DISCORD_URL } from "constants/ThirdPartyConstants";
import {
  PAGE_CLIENT_ERROR_DESCRIPTION,
  PAGE_CLIENT_ERROR_TITLE,
  createMessage,
} from "ee/constants/messages";
import { useDispatch } from "react-redux";

import { Button } from "@appsmith/ads";

import Page from "./Page";

function GenericError(props: { errorCode?: string }) {
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
            window.open(DISCORD_URL, "_blank");
          }}
          size="md"
        >
          Contact us on discord
        </Button>
      }
      description={createMessage(PAGE_CLIENT_ERROR_DESCRIPTION)}
      errorCode={props.errorCode}
      title={createMessage(PAGE_CLIENT_ERROR_TITLE)}
    />
  );
}

export default GenericError;
