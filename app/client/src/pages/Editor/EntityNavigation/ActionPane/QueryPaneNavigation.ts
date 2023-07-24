import { call, delay, put, select, take } from "redux-saga/effects";
import type { EntityInfo, IQueryPaneNavigationConfig } from "../types";
import { ActionPaneNavigation } from "./exports";
import { NAVIGATION_DELAY } from "../costants";
import { setQueryPaneConfigSelectedTabIndex } from "actions/queryPaneActions";
import { EDITOR_TABS } from "constants/QueryEditorConstants";
import { getFormEvaluationState } from "selectors/formSelectors";
import type { FormEvaluationState } from "reducers/evaluationReducers/formEvaluationReducer";
import { isEmpty } from "lodash";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { isActionSaving } from "selectors/entitiesSelector";

export default class QueryPaneNavigation extends ActionPaneNavigation {
  constructor(entityInfo: EntityInfo) {
    super(entityInfo);
    this.getConfig = this.getConfig.bind(this);
    this.navigate = this.navigate.bind(this);

    this.getTab = this.getTab.bind(this);
    this.waitForFormUpdate = this.waitForFormUpdate.bind(this);
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

    if (config.tab) {
      yield put(setQueryPaneConfigSelectedTabIndex(config.tab));
      yield delay(NAVIGATION_DELAY);
    }

    yield call(this.waitForFormUpdate);
    yield call(this.scrollToView, this.entityInfo.propertyPath);
  }

  *waitForFormUpdate() {
    const formEvaluationState: FormEvaluationState = yield select(
      getFormEvaluationState,
    );
    if (isEmpty(formEvaluationState[this.action.id])) {
      yield take(ReduxActionTypes.SET_FORM_EVALUATION);
      yield delay(NAVIGATION_DELAY);
    }
    const isSaving: boolean = yield select(isActionSaving(this.action.id));
    if (isSaving) {
      yield take(ReduxActionTypes.UPDATE_ACTION_SUCCESS);
      yield delay(NAVIGATION_DELAY);
    }
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
