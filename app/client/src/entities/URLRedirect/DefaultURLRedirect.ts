import { ApplicationVersion } from "ee/actions/applicationActions";
import type { ApplicationPayload } from "entities/Application";
import { APP_MODE } from "entities/App";
import { select } from "redux-saga/effects";
import { builderURL } from "ee/RouteBuilder";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { isURLDeprecated } from "utils/helpers";
import URLRedirect from ".";

export default class DefaultURLRedirect extends URLRedirect {
  constructor(mode: APP_MODE) {
    super(mode);
  }

  *generateRedirectURL(basePageId: string) {
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
      basePageId,
      hash,
    });
    return newURL;
  }
}
