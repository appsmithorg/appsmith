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
import WidgetFactory from "WidgetProvider/factory";
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
import {
  getSelectedPropertyPanel,
  getWidgetPropsForPropertyPane,
} from "selectors/propertyPaneSelectors";
import type { SelectedPropertyPanel } from "reducers/uiReducers/propertyPaneReducer";
import { setSelectedPropertyTabIndex } from "actions/editorContextActions";
import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { NAVIGATION_DELAY } from "../costants";
import { getWidgetEnhancementSelector } from "selectors/widgetEnhancementSelectors";
import { evaluateHiddenProperty } from "pages/Editor/PropertyPane/helpers";
import { NavigationMethod } from "utils/history";

export default class PropertyPaneNavigation extends PaneNavigation {
  widget!: WidgetProps;

  constructor(entityInfo: EntityInfo) {
    super(entityInfo);
    this.init = this.init.bind(this);
    this.getConfig = this.getConfig.bind(this);
    this.navigate = this.navigate.bind(this);

    this.navigateToPanel = this.navigateToPanel.bind(this);
  }

  *init() {
    if (!this.entityInfo) throw Error(`Initialisation failed`);

    const widget: WidgetProps | undefined = yield select(
      getWidgetByID(this.entityInfo?.id),
    );

    if (!widget) throw Error(`Couldn't find widget with ${this.entityInfo.id}`);

    this.widget = widget;
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  *getConfig(): any {
    const config: PropertyPaneNavigationConfig = {
      tabIndex: 0,
      panelStack: [],
    };

    if (!this.widget || !this.entityInfo)
      throw Error(`Unable to generate navigation config`);

    if (!this.entityInfo.propertyPath) return config;

    const propertyPaneContentConfig =
      WidgetFactory.getWidgetPropertyPaneContentConfig(
        this.widget?.type,
        this.widget,
      );
    const propertyPaneStyleConfig =
      WidgetFactory.getWidgetPropertyPaneStyleConfig(this.widget?.type);
    const widgetProps: WidgetProps | undefined = yield select(
      getWidgetPropsForPropertyPane,
    );

    const enhancementSelector = yield call(
      getWidgetEnhancementSelector,
      widgetProps?.widgetId,
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enhancements = yield select(enhancementSelector as any);
    const finalProps = yield call(
      evaluateHiddenProperty,
      [...propertyPaneContentConfig, ...propertyPaneStyleConfig],
      widgetProps,
      enhancements?.enhancementFns?.shouldHidePropertyFn,
    );
    const evaluateHiddenPropertyCallback = (
      propertyPaneConfig: readonly PropertyPaneConfig[],
    ) => {
      return evaluateHiddenProperty(
        propertyPaneConfig,
        widgetProps,
        enhancements?.enhancementFns?.shouldHidePropertyFn,
      );
    };

    // Get the panel config
    if (this.entityInfo.propertyPath) {
      config["panelStack"] = yield call(
        getPropertyPanePanelNavigationConfig,
        finalProps,
        this.widget,
        this.entityInfo.propertyPath,
        evaluateHiddenPropertyCallback,
      );

      // If the field is in a sub-panel we search the style config of that panel
      const panelStack = config["panelStack"];
      let panelStyleConfig: PropertyPaneConfig[] = [];
      let panelContentConfig: PropertyPaneConfig[] = [];
      // The number of sub-panels after which we found the property;
      const panelDepth = panelStack.length;

      if (panelStack?.length) {
        panelStyleConfig = panelStack[panelDepth - 1]?.styleChildren || [];
        panelContentConfig = panelStack[panelDepth - 1]?.contentChildren || [];
      }

      config["tabIndex"] = yield call(
        getSelectedTabIndex,
        panelStyleConfig.length ? panelStyleConfig : propertyPaneStyleConfig,
        this.entityInfo.propertyPath,
      );

      // Get section id
      config["sectionId"] = yield call(
        getSectionId,
        panelDepth
          ? [...panelContentConfig, ...panelStyleConfig]
          : [...propertyPaneContentConfig, ...propertyPaneStyleConfig],
        this.entityInfo.propertyPath,
      );
    }

    return config;
  }

  *navigate() {
    if (!this.widget) throw Error("Initialisation failed");

    // Initially select widget
    yield put(
      selectWidgetInitAction(
        SelectionRequestType.One,
        [this.widget.widgetId],
        NavigationMethod.Debugger,
      ),
    );
    yield delay(NAVIGATION_DELAY);

    const navigationConfig: PropertyPaneNavigationConfig = yield call(
      this.getConfig,
    );

    // Nothing more to do if we don't have the property path
    if (!this.entityInfo.propertyPath) return;

    // Switch to the correct panel
    yield call(this.navigateToPanel, navigationConfig);

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

  *navigateToPanel(navigationConfig: PropertyPaneNavigationConfig) {
    const currentSelectedPanel: SelectedPropertyPanel = yield select(
      getSelectedPropertyPanel,
    );
    const propertyPathsToPop = Object.keys(currentSelectedPanel).filter(
      (path) => {
        return path.split(".")[0] === this.widget?.widgetName;
      },
    );

    // If we are at the destination panel already ignore
    if (propertyPathsToPop.length && navigationConfig.panelStack.length) {
      const destinationPathConfig =
        navigationConfig.panelStack[navigationConfig.panelStack.length - 1];
      const currentPath = propertyPathsToPop[propertyPathsToPop.length - 1];

      if (
        `${this.widget.widgetName}.${destinationPathConfig.path}` ===
          currentPath &&
        destinationPathConfig.index === currentSelectedPanel[currentPath]
      ) {
        return;
      }
    }

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
  }
}
