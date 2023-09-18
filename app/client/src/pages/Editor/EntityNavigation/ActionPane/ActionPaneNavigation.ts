import type { Action } from "entities/Action";
import type { EntityInfo } from "../types";
import {
  getAction,
  getPlugin,
  getSettingConfig,
} from "@appsmith/selectors/entitiesSelector";
import { call, delay, put, select } from "redux-saga/effects";
import PaneNavigation from "../PaneNavigation";
import type { Plugin } from "api/PluginApi";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import history from "utils/history";
import { NAVIGATION_DELAY } from "../costants";
import { setFocusableInputField } from "actions/editorContextActions";

export default class ActionPaneNavigation extends PaneNavigation {
  action!: Action;

  constructor(entityInfo: EntityInfo) {
    super(entityInfo);
    this.init = this.init.bind(this);
    this.getConfig = this.getConfig.bind(this);
    this.navigate = this.navigate.bind(this);

    this.navigateToUrl = this.navigateToUrl.bind(this);
    this.scrollToView = this.scrollToView.bind(this);
    this.isInSettingsTab = this.isInSettingsTab.bind(this);
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
    const { id, pageId, pluginId, pluginType } = this.action;
    const applicationId: string = yield select(getCurrentApplicationId);
    const plugin: Plugin | undefined = yield select(getPlugin, pluginId);
    const actionConfig = getActionConfig(pluginType);
    const url =
      applicationId && actionConfig?.getURL(pageId, id, pluginType, plugin);
    if (!url) return;
    history.push(url);
    yield delay(NAVIGATION_DELAY);
    // Reset context switching field for the id, to allow scrolling to the error field
    yield put(setFocusableInputField(id));
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

  *isInSettingsTab(propertyPath: string) {
    const settingsConfig: any[] = yield select(
      getSettingConfig,
      this.action.pluginId,
    );
    let inSettingsTab = false;

    settingsConfig.forEach((section) => {
      if (section.children) {
        inSettingsTab = section.children.some((config: any) => {
          return propertyPath.includes(config.configProperty);
        });
      }
    });

    return inSettingsTab;
  }
}
