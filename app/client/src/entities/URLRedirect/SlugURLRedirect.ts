import type { ApplicationPayload } from "entities/Application";
import type { Page } from "entities/Page";
import { APP_MODE } from "entities/App";
import { select } from "redux-saga/effects";
import { fillPathname, viewerURL } from "ee/RouteBuilder";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { getPageByBaseId } from "selectors/editorSelectors";
import { getUpdatedRoute, isURLDeprecated } from "utils/helpers";
import URLRedirect from ".";

export class SlugURLRedirect extends URLRedirect {
  constructor(mode: APP_MODE) {
    super(mode);
  }

  *generateRedirectURL(basePageId: string, basePageIdInUrl: string) {
    const currentApplication: ApplicationPayload = yield select(
      getCurrentApplication,
    );
    const applicationSlug = currentApplication.slug;
    const currentPage: Page = yield select(getPageByBaseId(basePageId));
    const { customSlug = "", slug: pageSlug } = currentPage;
    let newURL = "";
    const { hash, pathname, search } = window.location;
    const isCurrentURLDeprecated =
      isURLDeprecated(pathname) || !basePageIdInUrl;
    if (!isCurrentURLDeprecated) {
      newURL =
        getUpdatedRoute(pathname, {
          applicationSlug,
          pageSlug,
          basePageId,
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
      newURL = viewerURL({ basePageId, hash });
    }
    return newURL;
  }
}
