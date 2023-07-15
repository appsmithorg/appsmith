import { call, delay, put, select } from "redux-saga/effects";
import { getWidgetByID } from "sagas/selectors";
import type { WidgetProps } from "widgets/BaseWidget";
import PaneNavigation from "../PaneNavigation";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getPropertyControlFocusElement } from "utils/editorContextUtils";
import type { EntityInfo, PropertyPaneNavigationConfig } from "../types";
import WidgetFactory from "utils/WidgetFactory";
import { getPropertyPanePanelNavigationConfig, getSectionId } from "./utils";
import {
  setPropertySectionState,
  setSelectedPropertyPanel,
  unsetSelectedPropertyPanel,
} from "actions/propertyPaneActions";
import { getSelectedPropertyPanel } from "selectors/propertyPaneSelectors";
import type { SelectedPropertyPanel } from "reducers/uiReducers/propertyPaneReducer";

export default class PropertyPaneNavigation extends PaneNavigation {
  widget?: WidgetProps;

  constructor(entityInfo: EntityInfo) {
    super(entityInfo);
    this.init = this.init.bind(this);
    this.getConfig = this.getConfig.bind(this);
    this.navigate = this.navigate.bind(this);
  }

  *init() {
    if (!this.entityInfo) throw Error(`Initialisation failed`);

    const widget: WidgetProps | undefined = yield select(
      getWidgetByID(this.entityInfo?.id),
    );

    if (!widget) throw Error(`Couldn't find widget with ${this.entityInfo.id}`);
    this.widget = widget;
  }

  *getConfig() {
    const config: PropertyPaneNavigationConfig = {};
    if (!this.widget || !this.entityInfo)
      throw Error(`Unable to generate navigation config`);
    if (!this.entityInfo.propertyPath) return config;

    const propertyPaneConfig = WidgetFactory.getWidgetPropertyPaneConfig(
      this.widget?.type,
    );

    // Get section id
    if (this.entityInfo.propertyPath) {
      config["panelStack"] = yield call(
        getPropertyPanePanelNavigationConfig,
        propertyPaneConfig,
        this.widget,
        this.entityInfo.propertyPath,
      );

      config["sectionId"] = yield call(
        getSectionId,
        propertyPaneConfig,
        this.entityInfo.propertyPath,
      );
    }

    return config;
  }

  *navigate() {
    if (!this.widget) throw Error("Initialisation failed");

    const navigationConfig: PropertyPaneNavigationConfig = yield call(
      this.getConfig,
    );

    // Initially select widget
    yield put(
      selectWidgetInitAction(SelectionRequestType.One, [this.widget.widgetId]),
    );
    yield delay(300);

    // Nothing more to do if we don't have the property path
    if (!this.entityInfo.propertyPath) return;

    // Switch to the correct panel
    const currentSelectedPanel: SelectedPropertyPanel = yield select(
      getSelectedPropertyPanel,
    );
    const propertyPathsToPop = Object.keys(currentSelectedPanel).filter(
      (path) => {
        return path.split(".")[0] === this.widget?.widgetName;
      },
    );
    if (propertyPathsToPop.length) {
      // Go back to starting panel
      for (const path of propertyPathsToPop.reverse()) {
        yield put(unsetSelectedPropertyPanel(path));
        yield delay(300);
      }
    }
    if (navigationConfig.panelStack) {
      for (const panel of navigationConfig.panelStack) {
        yield put(setSelectedPropertyPanel(panel.path, panel.index));
        yield delay(300);
      }
    }

    // Expand section
    if (navigationConfig.sectionId) {
      yield put(
        setPropertySectionState(
          `${this.widget.widgetId}.${navigationConfig.sectionId}`,
          true,
        ),
      );
      yield delay(300);
    }

    // Find and scroll to element
    const element = document.getElementById(
      btoa(`${this.widget.widgetId}.${this.entityInfo?.propertyPath}`),
    );
    const propertyPaneElement = getPropertyControlFocusElement(element);
    propertyPaneElement?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }
}
