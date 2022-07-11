import { ApplicationVersion } from "actions/applicationActions";
import { ApplicationPayload } from "ce/constants/ReduxActionConstants";
import { APP_MODE } from "entities/App";
import { select } from "redux-saga/effects";
import { builderURL } from "RouteBuilder";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { isURLDeprecated } from "utils/helpers";
import URLRedirect from ".";

export default class DefaultURLRedirect extends URLRedirect {
  constructor(mode: APP_MODE) {
    super(mode);
  }

  *generateRedirectURL(pageId: string) {
    const currentApplication: ApplicationPayload = yield select(
      getCurrentApplication,
    );
    let newURL = "";
    const { hash, pathname } = window.location;
    const shouldSwitchFromNewToLegacyURL =
      currentApplication.applicationVersion < ApplicationVersion.SLUG_URL &&
      !isURLDeprecated(pathname) &&
      this._mode === APP_MODE.EDIT;
    if (!shouldSwitchFromNewToLegacyURL) return;
    // We do not allow downgrading application version but,
    // when switch from a branch with slug URL to another one with legacy URLs,
    // we need to compute the legacy url
    // This scenario can happen only in edit mode.
    newURL = builderURL({
      pageId: pageId,
      hash,
    });
    return newURL;
  }
}
