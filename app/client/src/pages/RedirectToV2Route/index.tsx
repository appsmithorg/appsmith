import {
  getApplicationEditorPageURL,
  getApplicationViewerPageURL,
} from "constants/routes";
import { APP_MODE } from "entities/App";
import React from "react";
import { Redirect, RouteComponentProps } from "react-router";

function RedirectToV2Route(
  props: RouteComponentProps<{ pageId: string }> & { mode: APP_MODE },
) {
  const { pageId } = props.match.params;
  const isEditMode = props.mode === APP_MODE.EDIT;
  const redirectURL = isEditMode
    ? getApplicationEditorPageURL("application", "page", pageId)
    : getApplicationViewerPageURL({
        applicationSlug: "application",
        pageSlug: "page",
        pageId,
      });
  return <Redirect to={redirectURL} />;
}

export default RedirectToV2Route;
