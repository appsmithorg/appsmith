import { call, delay, put } from "redux-saga/effects";
import type { EntityInfo, IQueryPaneNavigationConfig } from "../types";
import { ActionPaneNavigation } from "./exports";
import { NAVIGATION_DELAY } from "../costants";
import { setQueryPaneConfigSelectedTabIndex } from "actions/queryPaneActions";
import { EDITOR_TABS } from "constants/QueryEditorConstants";
import log from "loglevel";

export default class QueryPaneNavigation extends ActionPaneNavigation {
  constructor(entityInfo: EntityInfo) {
    super(entityInfo);
    this.getConfig = this.getConfig.bind(this);
    this.navigate = this.navigate.bind(this);
    this.getTab = this.getTab.bind(this);
  }

  *getConfig() {
    let config: IQueryPaneNavigationConfig = {
      tab: EDITOR_TABS.QUERY,
    };
    if (!this.entityInfo.propertyPath) return {};
    const tab: string = yield call(this.getTab, this.entityInfo.propertyPath);

    config = {
      tab,
    };
    return config;
  }

  *navigate() {
    const config: IQueryPaneNavigationConfig = yield call(this.getConfig);

    yield call(this.navigateToUrl);
    if (!this.entityInfo.propertyPath) return;

    log.debug(config, "config");
    if (config.tab) {
      yield put(setQueryPaneConfigSelectedTabIndex(config.tab));
      yield delay(NAVIGATION_DELAY);
    }
    yield call(this.scrollToView, this.entityInfo.propertyPath);
  }

  *getTab(propertyPath: string) {
    let tab = EDITOR_TABS.QUERY;
    const modifiedProperty = propertyPath.replace(
      "config",
      "actionConfiguration",
    );
    const inSettingsTab: boolean = yield call(
      this.isInSettingsTab,
      modifiedProperty,
    );
    if (inSettingsTab) {
      tab = EDITOR_TABS.SETTINGS;
    }

    return tab;
  }
}
