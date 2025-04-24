import { getCurrentBasePageId } from "selectors/editorSelectors";
import PaneNavigation from "../PaneNavigation";
import type { JSCollection } from "entities/JSCollection";
import { call, delay, put, select } from "redux-saga/effects";
import history from "utils/history";
import { jsCollectionIdURL } from "ee/RouteBuilder";
import type { EntityInfo, IJSPaneNavigationConfig } from "../types";
import { setJsPaneConfigSelectedTab } from "actions/jsPaneActions";
import { JSEditorTab } from "reducers/uiReducers/jsPaneReducer";
import { NAVIGATION_DELAY } from "../costants";
import {
  setCodeEditorCursorAction,
  setFocusableInputField,
} from "actions/editorContextActions";
import { CursorPositionOrigin } from "ee/reducers/uiReducers/editorContextReducer";
import { getJSCollection } from "ee/selectors/entitiesSelector";

export default class JSObjectsPaneNavigation extends PaneNavigation {
  jsCollection!: JSCollection;

  constructor(entityInfo: EntityInfo) {
    super(entityInfo);
    this.init = this.init.bind(this);
    this.getConfig = this.getConfig.bind(this);
    this.navigate = this.navigate.bind(this);

    this.navigateToUrl = this.navigateToUrl.bind(this);
  }

  *init() {
    if (!this?.entityInfo) throw Error(`Initialisation failed`);

    const jsCollection: JSCollection | undefined = yield select(
      getJSCollection,
      this.entityInfo?.id,
    );

    if (!jsCollection)
      throw Error(`Couldn't find jsCollection with id: ${this.entityInfo.id}`);

    this.jsCollection = jsCollection;
  }

  *getConfig() {
    if (!this.entityInfo.propertyPath) return {};

    const tab: IJSPaneNavigationConfig["tab"] = yield call(
      this.getTab,
      this.entityInfo.propertyPath,
    );

    return {
      tab,
    };
  }

  *navigate() {
    const config: IJSPaneNavigationConfig = yield call(this.getConfig);

    yield call(this.navigateToUrl);

    yield delay(NAVIGATION_DELAY);
    yield put(setJsPaneConfigSelectedTab(config.tab));

    // Set cursor position
    if (this.entityInfo.position) {
      yield put(
        setFocusableInputField(
          `${this.jsCollection.name}.${this.entityInfo.propertyPath}`,
        ),
      );
      yield put(
        setCodeEditorCursorAction(
          `${this.jsCollection.name}.${this.entityInfo.propertyPath}`,
          this.entityInfo.position,
          CursorPositionOrigin.Navigation,
        ),
      );
    }
  }

  *getTab(propertyPath: string) {
    if (
      propertyPath.includes("runBehavior") ||
      propertyPath.includes("confirmBeforeExecute")
    ) {
      return JSEditorTab.SETTINGS;
    }

    return JSEditorTab.CODE;
  }

  *navigateToUrl() {
    const matchesActionName = this.jsCollection.actions.some((action) => {
      return action.name === this.entityInfo.propertyPath;
    });
    let functionName;

    if (matchesActionName) {
      functionName = this.entityInfo.propertyPath;
    }

    const basePageId: string = yield select(getCurrentBasePageId);
    const url = jsCollectionIdURL({
      basePageId,
      baseCollectionId: this.jsCollection.baseId,
      functionName,
    });

    history.push(url);
  }
}
