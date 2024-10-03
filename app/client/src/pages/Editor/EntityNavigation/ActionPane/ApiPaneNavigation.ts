import { call, delay, put } from "redux-saga/effects";
import type { EntityInfo, IApiPaneNavigationConfig } from "../types";
import { ActionPaneNavigation } from "./exports";
import { API_EDITOR_TABS } from "constants/ApiEditorConstants/CommonApiConstants";
import { setPluginActionEditorSelectedTab } from "PluginActionEditor/store";
import { NAVIGATION_DELAY } from "../costants";

export default class ApiPaneNavigation extends ActionPaneNavigation {
  constructor(entityInfo: EntityInfo) {
    super(entityInfo);
    this.getConfig = this.getConfig.bind(this);
    this.navigate = this.navigate.bind(this);
    this.getTab = this.getTab.bind(this);
  }

  *getConfig() {
    let config: IApiPaneNavigationConfig = {};

    if (!this.entityInfo.propertyPath) return {};

    const tab: string | undefined = yield call(
      this.getTab,
      this.entityInfo.propertyPath,
    );

    config = {
      tab,
    };

    return config;
  }

  *navigate() {
    const config: IApiPaneNavigationConfig = yield call(this.getConfig);

    yield call(this.navigateToUrl);

    if (!this.entityInfo.propertyPath) return;

    if (config.tab) {
      yield put(setPluginActionEditorSelectedTab(config.tab));
      yield delay(NAVIGATION_DELAY);
    }

    yield call(this.scrollToView, this.entityInfo.propertyPath);
  }

  *getTab(propertyPath: string) {
    let currentTab: string | undefined;
    const modifiedProperty = propertyPath.replace(
      "config",
      "actionConfiguration",
    );

    if (propertyPath.includes("headers")) currentTab = API_EDITOR_TABS.HEADERS;
    else if (propertyPath.includes("queryParameters"))
      currentTab = API_EDITOR_TABS.PARAMS;
    else if (
      propertyPath.includes("body") ||
      propertyPath.includes("pluginSpecifiedTemplates[1].value")
    )
      currentTab = API_EDITOR_TABS.BODY;
    else if (
      propertyPath.includes("pagination") ||
      propertyPath.includes("next") ||
      propertyPath.includes("prev") ||
      propertyPath.includes("limitBased")
    )
      currentTab = API_EDITOR_TABS.PAGINATION;
    else {
      const inSettingsTab: boolean = yield call(
        this.isInSettingsTab,
        modifiedProperty,
      );

      if (inSettingsTab) {
        currentTab = API_EDITOR_TABS.SETTINGS;
      }
    }

    return currentTab;
  }
}
