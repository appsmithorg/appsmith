import { ApplicationPayload, Page } from "ce/constants/ReduxActionConstants";
import { APP_MODE } from "entities/App";
import { select } from "redux-saga/effects";
import { fillPathname, viewerURL } from "RouteBuilder";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { getPageById } from "selectors/editorSelectors";
import { getUpdatedRoute, isURLDeprecated } from "utils/helpers";
import URLRedirect from ".";

export class SlugURLRedirect extends URLRedirect {
  constructor(mode: APP_MODE) {
    super(mode);
  }

  *generateRedirectURL(pageId: string, pageIdInUrl: string) {
    const currentApplication: ApplicationPayload = yield select(
      getCurrentApplication,
    );
    const applicationSlug = currentApplication.slug;
    const currentPage: Page = yield select(getPageById(pageId));
    const { customSlug = "", slug: pageSlug } = currentPage;
    let newURL = "";
    const { hash, pathname, search } = window.location;
    const isCurrentURLDeprecated = isURLDeprecated(pathname) || !pageIdInUrl;
    if (!isCurrentURLDeprecated) {
      newURL =
        getUpdatedRoute(pathname, {
          applicationSlug,
          pageSlug,
          pageId,
          customSlug,
        }) +
        search +
        hash;
      return newURL;
    }
    const onlyReplaceBaseURL = this._mode === APP_MODE.EDIT;
    if (onlyReplaceBaseURL) {
      newURL =
        fillPathname(pathname, currentApplication, currentPage) + search + hash;
    } else {
      // View Mode - generate a new viewer URL - auto updates query params
      newURL = viewerURL({ pageId, hash });
    }
    return newURL;
  }
}
