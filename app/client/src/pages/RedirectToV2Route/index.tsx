import {
  getApplicationEditorPageURL,
  getApplicationViewerPageURL,
} from "constants/routes";
import { APP_MODE } from "entities/App";
import React from "react";
import { Redirect, RouteComponentProps } from "react-router";
import {
  PLACEHOLDER_APP_SLUG,
  PLACEHOLDER_PAGE_ID,
  PLACEHOLDER_PAGE_SLUG,
} from "utils/helpers";

function RedirectToV2Route(
  props: RouteComponentProps<{ applicationId: string; pageId: string }> & {
    mode: APP_MODE;
  },
) {
  /** Some valid old urls
   * /applications/620d13b83826686f115a432d/pages/610t13b83826686f115a432w/edit
   * /applications/620d13b83826686f115a432d/pages/610t13b83826686f115a432w
   * /applications/620d13b83826686f115a432d/edit
   * /applications/620d13b83826686f115a432d
   * */

  const { applicationId, pageId } = props.match.params;

  // If there are old bookmarked routes that do not have page id in it, we need to use the applicationId as a fallback. Eg.(/applications/620d13b83826686f115a432d/edit)
  // The logic here is to set the applicationId as the applicationSlug and build an intermediate route with placeholder values for pageSlug and pageId.
  // The initialize(Editor|Viewer) calls in initSaga will use applicationSlug as applicationId when pageId is just a placeholder.
  // The route is then substituted with the right slug names and IDs inside the initialize logic.
  const applicationSlug = !pageId ? applicationId : PLACEHOLDER_APP_SLUG;
  const currentPageId = pageId ?? PLACEHOLDER_PAGE_ID;
  const isEditMode = props.mode === APP_MODE.EDIT;

  // At the point, we have no way to figure out the right page slug
  // We will use placeholder slug for now and later replace it.
  const pageSlug = PLACEHOLDER_PAGE_SLUG;

  // Redirects based on the mode of the application
  const redirectURL = isEditMode
    ? getApplicationEditorPageURL(applicationSlug, pageSlug, currentPageId)
    : getApplicationViewerPageURL({
        applicationSlug: applicationSlug,
        pageSlug,
        pageId: currentPageId,
      });
  return <Redirect to={redirectURL} />;
}

export default RedirectToV2Route;
