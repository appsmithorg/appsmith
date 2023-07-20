import { call, delay, put, select } from "redux-saga/effects";
import { getWidgetByID } from "sagas/selectors";
import type { WidgetProps } from "widgets/BaseWidget";
import PaneNavigation from "../PaneNavigation";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getPropertyControlFocusElement } from "utils/editorContextUtils";
import type {
  EntityInfo,
  IPanelStack,
  PropertyPaneNavigationConfig,
} from "../types";
import WidgetFactory from "utils/WidgetFactory";
import {
  getPropertyPanePanelNavigationConfig,
  getSectionId,
  getSelectedTabIndex,
} from "./utils";
import {
  setPropertySectionState,
  setSelectedPropertyPanel,
  unsetSelectedPropertyPanel,
} from "actions/propertyPaneActions";
import { getSelectedPropertyPanel } from "selectors/propertyPaneSelectors";
import type { SelectedPropertyPanel } from "reducers/uiReducers/propertyPaneReducer";
import { setSelectedPropertyTabIndex } from "actions/editorContextActions";
import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { NAVIGATION_DELAY } from "../costants";

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
    const config: PropertyPaneNavigationConfig = {
      tabIndex: 0,
      panelStack: [],
    };
    if (!this.widget || !this.entityInfo)
      throw Error(`Unable to generate navigation config`);
    if (!this.entityInfo.propertyPath) return config;

    const propertyPaneContentConfig =
      WidgetFactory.getWidgetPropertyPaneContentConfig(this.widget?.type);
    const propertyPaneStyleConfig =
      WidgetFactory.getWidgetPropertyPaneStyleConfig(this.widget?.type);

    // Get the panel config
    if (this.entityInfo.propertyPath) {
      config["panelStack"] = yield call(
        getPropertyPanePanelNavigationConfig,
        [...propertyPaneContentConfig, ...propertyPaneStyleConfig],
        this.widget,
        this.entityInfo.propertyPath,
      );

      // If the field is in a sub-panel we search the style config of that panel
      const panelStack = config["panelStack"];
      let panelStyleConfig: PropertyPaneConfig[] = [];
      let panelContentConfig: PropertyPaneConfig[] = [];
      if (panelStack?.length) {
        panelStyleConfig =
          panelStack[panelStack.length - 1]?.styleChildren || [];
        panelContentConfig =
          panelStack[panelStack.length - 1]?.contentChildren || [];
      }
      config["tabIndex"] = yield call(
        getSelectedTabIndex,
        panelStyleConfig.length ? panelStyleConfig : propertyPaneStyleConfig,
        this.entityInfo.propertyPath,
      );

      // Get section id
      config["sectionId"] = yield call(
        getSectionId,
        panelStack?.length
          ? [...panelContentConfig, ...panelStyleConfig]
          : [...propertyPaneContentConfig, ...propertyPaneStyleConfig],
        this.entityInfo.propertyPath,
        this.widget,
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
    yield delay(NAVIGATION_DELAY);

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
        yield delay(NAVIGATION_DELAY);
      }
    }
    if (navigationConfig.panelStack.length) {
      yield put(setSelectedPropertyTabIndex(0));
      for (const panel of navigationConfig.panelStack) {
        yield put(
          setSelectedPropertyPanel(
            `${this.widget.widgetName}.${panel.path}`,
            panel.index,
          ),
        );
        // Set all tabs to default
        yield put(
          setSelectedPropertyTabIndex(
            0,
            `${this.widget.widgetName}.${panel.path}.${panel.panelLabel}`,
          ),
        );
        yield delay(NAVIGATION_DELAY);
      }
    }

    // Switch to the appropriate tab
    let panelConfig: IPanelStack | undefined;
    let panelIndexPath: string | undefined;
    if (navigationConfig.panelStack.length) {
      panelConfig =
        navigationConfig.panelStack[navigationConfig.panelStack.length - 1];
      panelIndexPath = `${this.widget.widgetName}.${panelConfig?.path}.${panelConfig?.panelLabel}`;
    }
    yield put(
      setSelectedPropertyTabIndex(navigationConfig.tabIndex, panelIndexPath),
    );
    yield delay(NAVIGATION_DELAY);

    // Expand section
    if (navigationConfig.sectionId) {
      const panelPropertyPath = navigationConfig.panelStack.length
        ? `${this.widget.widgetName}.${panelConfig?.path}.${panelConfig?.panelLabel}`
        : undefined;
      yield put(
        setPropertySectionState(
          `${this.widget.widgetId}.${navigationConfig.sectionId}`,
          true,
          panelPropertyPath,
        ),
      );
      yield delay(NAVIGATION_DELAY);
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
