import React from "react";
import BaseWidget, { WidgetState } from "widgets/BaseWidget";
import {
  EventType,
  ExecuteTriggerPayload,
} from "constants/AppsmithActionConstants/ActionConstants";
import MenuButtonComponent from "../component";
import { MinimumPopupRows } from "widgets/constants";
import { MenuButtonWidgetProps, MenuItem, MenuItemsSource } from "../constants";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";
import equal from "fast-deep-equal/es6";
import { isArray, orderBy } from "lodash";
import { getSourceDataKeys } from "./helper";
import { Stylesheet } from "entities/AppTheming";

class MenuButtonWidget extends BaseWidget<MenuButtonWidgetProps, WidgetState> {
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
    const {
      configureMenuItems,
      menuItems,
      menuItemsSource,
      sourceData,
    } = this.props;
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

  componentDidMount = () => {
    super.updateWidgetProperty("sourceDataKeys", getSourceDataKeys(this.props));
  };

  componentDidUpdate = (prevProps: MenuButtonWidgetProps) => {
    if (!equal(prevProps.sourceData, this.props.sourceData)) {
      super.updateWidgetProperty(
        "sourceDataKeys",
        getSourceDataKeys(this.props),
      );
    }
  };

  getPageView() {
    const { componentWidth } = this.getComponentDimensions();
    const menuDropDownWidth = MinimumPopupRows * this.props.parentColumnSpace;

    return (
      <MenuButtonComponent
        {...this.props}
        getVisibleItems={this.getVisibleItems}
        menuDropDownWidth={menuDropDownWidth}
        onItemClicked={this.menuItemClickHandler}
        renderMode={this.props.renderMode}
        width={componentWidth}
      />
    );
  }

  static getWidgetType() {
    return "MENU_BUTTON_WIDGET";
  }
}

export default MenuButtonWidget;
