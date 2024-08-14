import { call, delay, put, race, select, take } from "redux-saga/effects";
import type { EntityInfo, IQueryPaneNavigationConfig } from "../types";
import { ActionPaneNavigation } from "./exports";
import { NAVIGATION_DELAY } from "../costants";
import { setQueryPaneConfigSelectedTabIndex } from "actions/queryPaneActions";
import { EDITOR_TABS } from "constants/QueryEditorConstants";
import { getFormEvaluationState } from "selectors/formSelectors";
import type { FormEvaluationState } from "reducers/evaluationReducers/formEvaluationReducer";
import { isEmpty } from "lodash";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { isActionSaving } from "ee/selectors/entitiesSelector";

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
    }

    yield call(this.waitForFormUpdate);
    yield call(this.scrollToView, this.entityInfo.propertyPath);
  }

  *waitForFormUpdate() {
    const formEvaluationState: FormEvaluationState = yield select(
      getFormEvaluationState,
    );
    const isSaving: boolean = yield select(isActionSaving(this.action.id));
    if (isEmpty(formEvaluationState[this.action.id]) || isSaving) {
      // Wait till the form fields are computed
      yield take(ReduxActionTypes.FORM_EVALUATION_EMPTY_BUFFER);
      yield delay(NAVIGATION_DELAY);
    } else {
      yield race({
        evaluation: take(ReduxActionTypes.FORM_EVALUATION_EMPTY_BUFFER),
        timeout: delay(NAVIGATION_DELAY),
      });
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
