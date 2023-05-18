import React from "react";
import { Button, Size } from "design-system-old";

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
          category="primary"
          className="button-position"
          icon="right-arrow"
          iconAlignment="right"
          onClick={() => {
            dispatch(flushErrors());
            window.open("https://discord.gg/rBTTVJp", "_blank");
          }}
          size={Size.large}
          text="Contact us on discord"
        />
      }
      description={createMessage(PAGE_CLIENT_ERROR_DESCRIPTION)}
      errorCode={props.errorCode}
      title={createMessage(PAGE_CLIENT_ERROR_TITLE)}
    />
  );
}

export default GenericError;
