import { call, delay, put, select } from "redux-saga/effects";
import { getWidgetByID } from "sagas/selectors";
import type { WidgetProps } from "widgets/BaseWidget";
import PaneNavigation from "../PaneNavigation";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getPropertyControlFocusElement } from "utils/editorContextUtils";
import type { EntityInfo, PropertyPaneNavigationConfig } from "../types";
import WidgetFactory from "utils/WidgetFactory";
import { getSectionId } from "./utils";
import log from "loglevel";
import { setPropertySectionState } from "actions/propertyPaneActions";

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
    if (!this.entityInfo.propertyPath)
      log.debug("Field level navigation not required");

    const propertyPaneConfig = WidgetFactory.getWidgetPropertyPaneConfig(
      this.widget?.type,
    );

    // Get section id
    if (this.entityInfo.propertyPath) {
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
    yield delay(500);

    // Expand section
    if (navigationConfig.sectionId) {
      yield put(
        setPropertySectionState(
          `${this.widget.widgetId}.${navigationConfig.sectionId}`,
          true,
          this.entityInfo?.propertyPath,
        ),
      );
      yield delay(500);
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
