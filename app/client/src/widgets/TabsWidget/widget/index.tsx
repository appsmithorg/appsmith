import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import {
  FlexVerticalAlignment,
  LayoutDirection,
  Positioning,
} from "layoutSystems/common/utils/constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import type { ValidationResponse } from "constants/WidgetValidation";
import { ValidationTypes } from "constants/WidgetValidation";
import { find } from "lodash";
import React from "react";
import { LayoutSystemTypes } from "layoutSystems/types";
import type { WidgetProperties } from "selectors/propertyPaneSelectors";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { WidgetState } from "../../BaseWidget";
import BaseWidget from "../../BaseWidget";
import TabsComponent from "../component";
import type { TabContainerWidgetProps, TabsWidgetProps } from "../constants";
import derivedPropertyFns from "./derived";
import { parseDerivedProperties } from "widgets/WidgetUtils";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import {
  isAutoHeightEnabledForWidget,
  isAutoHeightEnabledForWidgetWithLimits,
  DefaultAutocompleteDefinitions,
} from "widgets/WidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { Colors } from "constants/Colors";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import {
  GridDefaults,
  WIDGET_TAGS,
  WidgetHeightLimits,
} from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { renderAppsmithCanvas } from "layoutSystems/CanvasFactory";

export function selectedTabValidation(
  value: unknown,
  props: TabContainerWidgetProps,
): ValidationResponse {
  const tabs: Array<{
    label: string;
    id: string;
  }> = props.tabsObj ? Object.values(props.tabsObj) : props.tabs || [];
  const tabNames = tabs.map((i: { label: string; id: string }) => i.label);

  return {
    isValid: value === "" ? true : tabNames.includes(value as string),
    parsed: value,
    messages: [
      {
        name: "ValidationError",
        message: `Tab name ${value} does not exist`,
      },
    ],
  };
}
class TabsWidget extends BaseWidget<
  TabsWidgetProps<TabContainerWidgetProps>,
  WidgetState
> {
  static type = "TABS_WIDGET";

  static getConfig() {
    return {
      name: "Tabs",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.LAYOUT],
      needsMeta: true,
      isCanvas: true,
    };
  }

  static getFeatures() {
    return {
      dynamicHeight: {
        sectionIndex: 1,
        active: true,
      },
    };
  }

  static getDefaults() {
    return {
      flexVerticalAlignment: FlexVerticalAlignment.Stretch,
      responsiveBehavior: ResponsiveBehavior.Fill,
      minWidth: FILL_WIDGET_MIN_WIDTH,
      rows: WidgetHeightLimits.MIN_CANVAS_HEIGHT_IN_ROWS + 5,
      columns: 24,
      shouldScrollContents: false,
      widgetName: "Tabs",
      animateLoading: true,
      borderWidth: 1,
      borderColor: Colors.GREY_5,
      backgroundColor: Colors.WHITE,
      minDynamicHeight: WidgetHeightLimits.MIN_CANVAS_HEIGHT_IN_ROWS + 5,
      tabsObj: {
        tab1: {
          label: "Tab 1",
          id: "tab1",
          widgetId: "",
          isVisible: true,
          index: 0,
          positioning: Positioning.Vertical,
        },
        tab2: {
          label: "Tab 2",
          id: "tab2",
          widgetId: "",
          isVisible: true,
          index: 1,
          positioning: Positioning.Vertical,
        },
      },
      shouldShowTabs: true,
      defaultTab: "Tab 1",
      blueprint: {
        view: [
          {
            type: "CANVAS_WIDGET",
            position: { left: 0, top: 0 },
            props: {
              detachFromLayout: true,
              canExtend: true,
              isVisible: true,
              isDisabled: false,
              shouldScrollContents: false,
              tabId: "tab1",
              tabName: "Tab 1",
              children: [],
              version: 1,
              bottomRow: WidgetHeightLimits.MIN_CANVAS_HEIGHT_IN_ROWS,
            },
          },
          {
            type: "CANVAS_WIDGET",
            position: { left: 0, top: 0 },
            props: {
              detachFromLayout: true,
              canExtend: true,
              isVisible: true,
              isDisabled: false,
              shouldScrollContents: false,
              tabId: "tab2",
              tabName: "Tab 2",
              children: [],
              version: 1,
              bottomRow: WidgetHeightLimits.MIN_CANVAS_HEIGHT_IN_ROWS,
            },
          },
        ],
        operations: [
          {
            type: BlueprintOperationTypes.MODIFY_PROPS,
            fn: (widget: WidgetProps & { children?: WidgetProps[] }) => {
              const tabs = Object.values({ ...widget.tabsObj });
              const tabIds: Record<string, string> = (
                widget.children || []
              ).reduce((idsObj, eachChild) => {
                idsObj = { ...idsObj, [eachChild.tabId]: eachChild.widgetId };

                return idsObj;
              }, {});
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const tabsObj = tabs.reduce((obj: any, tab: any) => {
                const newTab = { ...tab };

                newTab.widgetId = tabIds[newTab.id];
                obj[newTab.id] = newTab;

                return obj;
              }, {});
              const updatePropertyMap = [
                {
                  widgetId: widget.widgetId,
                  propertyName: "tabsObj",
                  propertyValue: tabsObj,
                },
              ];

              return updatePropertyMap;
            },
          },
        ],
      },
      version: 3,
    };
  }

  static getMethods() {
    return {
      getCanvasHeightOffset: (props: WidgetProps): number => {
        let offset =
          props.borderWidth && props.borderWidth > 1
            ? Math.ceil(
                (2 * parseInt(props.borderWidth, 10) || 0) /
                  GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
              )
            : 0;

        if (props.shouldShowTabs === true) {
          offset += 4;
        }

        return offset;
      },
    };
  }

  static getAutoLayoutConfig() {
    return {
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "280px",
              minHeight: "300px",
            };
          },
        },
      ],
      disableResizeHandles: {
        vertical: true,
      },
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "300px" },
        minWidth: { base: "280px" },
      },
    };
  }

  static getDependencyMap(): Record<string, string[]> {
    return {
      defaultTab: ["tabsObj", "tabs"],
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            propertyName: "tabsObj",
            isJSConvertible: false,
            label: "Tabs",
            helpText: "Tabs",
            controlType: "TABS_INPUT",
            isBindProperty: false,
            isTriggerProperty: false,
            updateRelatedWidgetProperties: (
              propertyPath: string,
              propertyValue: string,
              props: WidgetProperties,
            ) => {
              const propertyPathSplit = propertyPath.split(".");
              const property = propertyPathSplit.pop();

              if (property === "label") {
                const itemId = propertyPathSplit.pop() || "";
                const item = props.tabsObj[itemId];

                if (item) {
                  return [
                    {
                      widgetId: item.widgetId,
                      updates: {
                        modify: {
                          tabName: propertyValue,
                        },
                      },
                    },
                  ];
                }
              }

              return [];
            },
            panelConfig: {
              editableTitle: true,
              titlePropertyName: "label",
              panelIdPropertyName: "id",
              updateHook: (
                // TODO: Fix this the next time the file is edited
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                props: any,
                propertyPath: string,
                propertyValue: string,
              ) => {
                return [
                  {
                    propertyPath,
                    propertyValue,
                  },
                ];
              },
              children: [
                {
                  sectionName: "General",
                  children: [
                    {
                      propertyName: "isVisible",
                      label: "Visible",
                      helpText: "Controls the visibility of the tab",
                      controlType: "SWITCH",
                      useValidationMessage: true,
                      isJSConvertible: true,
                      isBindProperty: true,
                      isTriggerProperty: false,
                      validation: { type: ValidationTypes.BOOLEAN },
                    },
                  ],
                },
              ],
            },
          },
          {
            propertyName: "defaultTab",
            helpText: "Selects a tab name specified by default",
            placeholderText: "Tab 1",
            label: "Default tab",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: selectedTabValidation,
                expected: {
                  type: "Tab Name (string)",
                  example: "Tab 1",
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
            dependencies: ["tabsObj", "tabs"],
          },
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Enables scrolling for content inside the widget",
            propertyName: "shouldScrollContents",
            label: "Scroll contents",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "animateLoading",
            label: "Animate loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "shouldShowTabs",
            helpText:
              "Hides the tabs so that different widgets can be displayed based on the default tab",
            label: "Show tabs",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
            postUpdateAction: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "when the button is clicked",
            propertyName: "onTabSelected",
            label: "onTabSelected",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Colors, Borders and Shadows",
        children: [
          {
            propertyName: "accentColor",
            helpText: "Sets the color of the selected tab's underline ",
            label: "Accent color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Use a html color name, HEX, RGB or RGBA value",
            placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
            propertyName: "backgroundColor",
            label: "Background color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Use a html color name, HEX, RGB or RGBA value",
            placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
            propertyName: "borderColor",
            label: "Border color",
            controlType: "COLOR_PICKER",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Enter value for border width",
            propertyName: "borderWidth",
            label: "Border width",
            placeholderText: "Enter value in px",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
            postUpdateAction: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
          },
          {
            propertyName: "borderRadius",
            label: "Border radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",

            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "boxShadow",
            label: "Box shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
      },
    };
  }

  callDynamicHeightUpdates = () => {
    const { checkContainersForAutoHeight } = this.context;

    checkContainersForAutoHeight && checkContainersForAutoHeight();
  };

  callPositionUpdates = (tabWidgetId: string) => {
    const { updatePositionsOnTabChange } = this.context;

    updatePositionsOnTabChange &&
      updatePositionsOnTabChange(this.props.widgetId, tabWidgetId);
  };

  onTabChange = (tabWidgetId: string) => {
    this.props.updateWidgetMetaProperty("selectedTabWidgetId", tabWidgetId, {
      triggerPropertyName: "onTabSelected",
      dynamicString: this.props.onTabSelected,
      event: {
        type: EventType.ON_TAB_CHANGE,
      },
    });
    setTimeout(this.callDynamicHeightUpdates, 0);
    setTimeout(() => this.callPositionUpdates(tabWidgetId), 0);
  };

  static getStylesheetConfig(): Stylesheet {
    return {
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    };
  }

  static getDerivedPropertiesMap() {
    const parsedDerivedProperties = parseDerivedProperties(derivedPropertyFns);

    return {
      selectedTab: `{{(()=>{${parsedDerivedProperties.getSelectedTab}})()}}`,
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      selectedTab: "string",
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedTabWidgetId: undefined,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  getWidgetView() {
    const { componentWidth } = this.props;
    const tabsComponentProps = {
      ...this.props,
      tabs: this.getVisibleTabs(),
      width: componentWidth - WIDGET_PADDING * 2,
    };
    const isAutoHeightEnabled: boolean =
      isAutoHeightEnabledForWidget(this.props) &&
      !isAutoHeightEnabledForWidgetWithLimits(this.props);

    return (
      <TabsComponent
        {...tabsComponentProps}
        $noScroll={isAutoHeightEnabled}
        backgroundColor={this.props.backgroundColor}
        borderColor={this.props.borderColor}
        borderRadius={this.props.borderRadius}
        borderWidth={this.props.borderWidth}
        boxShadow={this.props.boxShadow}
        onTabChange={this.onTabChange}
        primaryColor={this.props.primaryColor}
        selectedTabWidgetId={this.getSelectedTabWidgetId()}
        shouldScrollContents={
          this.props.shouldScrollContents &&
          this.props.layoutSystemType === LayoutSystemTypes.FIXED
        }
      >
        {this.renderComponent()}
      </TabsComponent>
    );
  }

  renderComponent = () => {
    const selectedTabWidgetId = this.getSelectedTabWidgetId();
    const childWidgetData = {
      ...this.props.children?.filter(Boolean).filter((item) => {
        return selectedTabWidgetId === item.widgetId;
      })[0],
    };

    if (!childWidgetData) {
      return null;
    }

    childWidgetData.canExtend = this.props.shouldScrollContents;
    const { componentHeight, componentWidth } = this.props;

    childWidgetData.rightColumn = componentWidth;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.bottomRow = this.props.shouldScrollContents
      ? childWidgetData.bottomRow
      : componentHeight - 1;
    childWidgetData.parentId = this.props.widgetId;
    childWidgetData.minHeight = componentHeight;
    const selectedTabProps = Object.values(this.props.tabsObj)?.filter(
      (item) => item.widgetId === selectedTabWidgetId,
    )[0];
    const positioning: Positioning =
      this.props.layoutSystemType == LayoutSystemTypes.AUTO
        ? Positioning.Vertical
        : Positioning.Fixed;

    childWidgetData.positioning = positioning;
    childWidgetData.useAutoLayout = positioning !== Positioning.Fixed;
    childWidgetData.direction =
      positioning === Positioning.Vertical
        ? LayoutDirection.Vertical
        : LayoutDirection.Horizontal;
    childWidgetData.alignment = selectedTabProps?.alignment;
    childWidgetData.spacing = selectedTabProps?.spacing;

    return renderAppsmithCanvas(childWidgetData as WidgetProps);
  };

  private getSelectedTabWidgetId() {
    let selectedTabWidgetId = this.props.selectedTabWidgetId;

    if (this.props.children) {
      selectedTabWidgetId =
        this.props.children.find((tab) =>
          this.props.selectedWidgetAncestry?.includes(tab.widgetId),
        )?.widgetId ?? this.props.selectedTabWidgetId;
    }

    return selectedTabWidgetId;
  }

  componentDidUpdate(prevProps: TabsWidgetProps<TabContainerWidgetProps>) {
    const visibleTabs = this.getVisibleTabs();
    const selectedTab = find(visibleTabs, {
      widgetId: this.props.selectedTabWidgetId,
    });

    if (this.props.defaultTab !== prevProps.defaultTab || !selectedTab) {
      this.setDefaultSelectedTabWidgetId();
    }
  }

  getVisibleTabs = () => {
    const tabs = Object.values(this.props.tabsObj || {});

    if (tabs.length) {
      return tabs
        .filter(
          (tab) => tab.isVisible === undefined || !!tab.isVisible === true,
        )
        .sort((tab1, tab2) => tab1.index - tab2.index);
    }

    return [];
  };

  setDefaultSelectedTabWidgetId = () => {
    const visibleTabs = this.getVisibleTabs();
    // Find the default Tab object
    const defaultTab = find(visibleTabs, {
      label: this.props.defaultTab,
    });
    // Find the default Tab id
    const defaultTabWidgetId =
      defaultTab?.widgetId ?? visibleTabs?.[0]?.widgetId; // in case the default tab is deleted

    // If we have a legitimate default tab Id and it is not already the selected Tab
    if (
      defaultTabWidgetId &&
      defaultTabWidgetId !== this.props.selectedTabWidgetId
    ) {
      // Select the default tab
      this.props.updateWidgetMetaProperty(
        "selectedTabWidgetId",
        defaultTabWidgetId,
      );
      setTimeout(this.callDynamicHeightUpdates, 0);
    }
  };

  componentDidMount() {
    Object.keys(this.props.tabsObj || {}).length &&
      this.setDefaultSelectedTabWidgetId();
  }
}

export default TabsWidget;
