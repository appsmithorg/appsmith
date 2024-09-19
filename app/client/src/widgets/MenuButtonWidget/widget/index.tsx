import type { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import { isArray, orderBy } from "lodash";
import { default as React } from "react";
import type { WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import { MinimumPopupWidthInPercentage } from "WidgetProvider/constants";
import MenuButtonComponent from "../component";
import type { MenuButtonWidgetProps, MenuItem } from "../constants";
import { MenuItemsSource } from "../constants";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { ButtonPlacementTypes, ButtonVariantTypes } from "components/constants";
import { WIDGET_TAGS, layoutConfigurations } from "constants/WidgetConstants";

class MenuButtonWidget extends BaseWidget<MenuButtonWidgetProps, WidgetState> {
  static type = "MENU_BUTTON_WIDGET";

  static getConfig() {
    return {
      name: "Menu button",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.BUTTONS],
    };
  }

  static getDefaults() {
    return {
      label: "Open Menu",
      menuVariant: ButtonVariantTypes.PRIMARY,
      placement: ButtonPlacementTypes.CENTER,
      isCompact: false,
      isDisabled: false,
      isVisible: true,
      animateLoading: true,
      menuItemsSource: MenuItemsSource.STATIC,
      menuItems: {
        menuItem1: {
          label: "First Menu Item",
          id: "menuItem1",
          widgetId: "",
          isVisible: true,
          isDisabled: false,
          index: 0,
        },
        menuItem2: {
          label: "Second Menu Item",
          id: "menuItem2",
          widgetId: "",
          isVisible: true,
          isDisabled: false,
          index: 1,
        },
        menuItem3: {
          label: "Third Menu Item",
          id: "menuItem3",
          widgetId: "",
          isVisible: true,
          isDisabled: false,
          index: 2,
        },
      },
      rows: 4,
      columns: 16,
      widgetName: "MenuButton",
      version: 1,
    };
  }

  static getAutoLayoutConfig() {
    return {
      defaults: {
        rows: 4,
        columns: 6.632,
      },
      autoDimension: {
        width: true,
      },
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "120px",
              maxWidth: "360px",
              minHeight: "40px",
            };
          },
        },
      ],
      disableResizeHandles: {
        vertical: true,
        horizontal: true,
      },
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: { base: "360px" },
        minHeight: { base: "40px" },
        minWidth: { base: "120px" },
      },
    };
  }

  static getPropertyPaneContentConfig() {
    return contentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      menuColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Menu button widget is used to represent a set of actions in a group.",
      "!url": "https://docs.appsmith.com/widget-reference/menu-button",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      label: "string",
    };
  }

  menuItemClickHandler = (onClick: string | undefined, index: number) => {
    if (onClick) {
      const config: ExecuteTriggerPayload = {
        triggerPropertyName: "onClick",
        dynamicString: onClick,
        event: {
          type: EventType.ON_CLICK,
        },
      };

      if (this.props.menuItemsSource === MenuItemsSource.DYNAMIC) {
        config.globalContext = {
          currentItem: this.props.sourceData
            ? this.props.sourceData[index]
            : {},
          currentIndex: index,
        };
      }

      super.executeAction(config);
    }
  };

  getVisibleItems = () => {
    const { configureMenuItems, menuItems, menuItemsSource, sourceData } =
      this.props;

    if (menuItemsSource === MenuItemsSource.STATIC) {
      const visibleItems = Object.keys(menuItems)
        .map((itemKey) => menuItems[itemKey])
        .filter((item) => item.isVisible === true);

      return orderBy(visibleItems, ["index"], ["asc"]);
    } else if (
      menuItemsSource === MenuItemsSource.DYNAMIC &&
      isArray(sourceData) &&
      sourceData?.length &&
      configureMenuItems?.config
    ) {
      const { config } = configureMenuItems;
      const getValue = (propertyName: keyof MenuItem, index: number) => {
        const value = config[propertyName];

        if (isArray(value)) {
          return value[index];
        }

        return value ?? null;
      };

      const visibleItems = sourceData
        .map((item, index) => ({
          ...item,
          id: index.toString(),
          isVisible: getValue("isVisible", index),
          isDisabled: getValue("isDisabled", index),
          index: index,
          widgetId: "",
          label: getValue("label", index),
          onClick: config?.onClick,
          textColor: getValue("textColor", index),
          backgroundColor: getValue("backgroundColor", index),
          iconAlign: getValue("iconAlign", index),
          iconColor: getValue("iconColor", index),
          iconName: getValue("iconName", index),
        }))
        .filter((item) => item.isVisible === true);

      return visibleItems;
    }

    return [];
  };

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
        setDisabled: {
          path: "isDisabled",
          type: "boolean",
        },
      },
    };
  }

  getWidgetView() {
    const { componentWidth } = this.props;
    const menuDropDownWidth =
      (MinimumPopupWidthInPercentage / 100) *
      (this.props.mainCanvasWidth ?? layoutConfigurations.MOBILE.maxWidth);

    return (
      <MenuButtonComponent
        {...this.props}
        getVisibleItems={this.getVisibleItems}
        maxWidth={this.props.maxWidth}
        menuDropDownWidth={menuDropDownWidth}
        minHeight={this.props.minHeight}
        minWidth={this.props.minWidth}
        onItemClicked={this.menuItemClickHandler}
        renderMode={this.props.renderMode}
        shouldFitContent={this.isAutoLayoutMode}
        width={componentWidth}
      />
    );
  }

  static getWidgetType() {
    return;
  }
}

export default MenuButtonWidget;
