import type { Action } from "entities/Action";
import type { EntityInfo } from "../types";
import { getAction } from "selectors/entitiesSelector";
import { call, delay, select } from "redux-saga/effects";
import PaneNavigation from "../PaneNavigation";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import history from "utils/history";
import { NAVIGATION_DELAY } from "../costants";

export default class ActionPaneNavigation extends PaneNavigation {
  action!: Action;

  constructor(entityInfo: EntityInfo) {
    super(entityInfo);
    this.init = this.init.bind(this);
    this.getConfig = this.getConfig.bind(this);
    this.navigateToUrl = this.navigateToUrl.bind(this);
    this.scrollToView = this.scrollToView.bind(this);
  }

  *init() {
    if (!this?.entityInfo) throw Error(`Initialisation failed`);

    const action: Action | undefined = yield select(
      getAction,
      this.entityInfo?.id,
    );

    if (!action)
      throw Error(`Couldn't find action with id: ${this.entityInfo.id}`);
    this.action = action;
  }

  *getConfig(): any {
    return {};
  }

  *navigate(): any {
    yield call(this.navigateToUrl);

    if (!this.entityInfo.propertyPath) return;
    yield call(this.scrollToView, this.entityInfo.propertyPath);
  }

  *navigateToUrl() {
    const { id, pageId, pluginType } = this.action;
    const applicationId: string = yield select(getCurrentApplicationId);
    const actionConfig = getActionConfig(pluginType);
    const url = applicationId && actionConfig?.getURL(pageId, id, pluginType);
    if (!url) return;
    history.push(url);
    yield delay(NAVIGATION_DELAY);
  }

  *scrollToView(propertyPath: string) {
    const modifiedProperty = propertyPath.replace(
      "config",
      "actionConfiguration",
    );
    const element = document.querySelector(
      `[data-location-id="${btoa(modifiedProperty)}"]`,
    );
    element?.scrollIntoView({
      behavior: "smooth",
    });
  }
}
