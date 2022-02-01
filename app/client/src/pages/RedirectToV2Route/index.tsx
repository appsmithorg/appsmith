import { getApplicationEditorPageURL } from "constants/routes";
import React from "react";
import { Redirect, RouteComponentProps } from "react-router";

function RedirectToV2Route(props: RouteComponentProps<{ pageId: string }>) {
  const { pageId } = props.match.params;
  const redirectURL = getApplicationEditorPageURL(
    "appSlug",
    "pageSlug",
    pageId,
  );
  return <Redirect to={redirectURL} />;
}

export default RedirectToV2Route;
