import React from "react";
import { Button } from "design-system";

import Page from "./Page";
import {
  createMessage,
  PAGE_CLIENT_ERROR_DESCRIPTION,
  PAGE_CLIENT_ERROR_TITLE,
} from "@appsmith/constants/messages";
import { flushErrors } from "actions/errorActions";
import { useDispatch } from "react-redux";

function GenericError(props: { errorCode?: string }) {
  const dispatch = useDispatch();
  return (
    <Page
      cta={
        <Button
          className="button-position"
          kind="primary"
          onClick={() => {
            dispatch(flushErrors());
            window.open("https://discord.gg/rBTTVJp", "_blank");
          }}
          size="md"
          startIcon="right-arrow"
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
