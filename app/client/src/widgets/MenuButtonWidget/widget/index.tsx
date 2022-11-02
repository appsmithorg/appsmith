import React from "react";
import BaseWidget, { WidgetState } from "widgets/BaseWidget";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import MenuButtonComponent from "../component";
import { MinimumPopupRows } from "widgets/constants";
import { MenuButtonWidgetProps, MenuItemsSource } from "../constants";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";
import equal from "fast-deep-equal/es6";
import orderBy from "lodash/orderBy";
import { isArray } from "lodash";

class MenuButtonWidget extends BaseWidget<MenuButtonWidgetProps, WidgetState> {
  static getPropertyPaneContentConfig() {
    return contentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

  menuItemClickHandler = (onClick: string | undefined, index: number) => {
    if (onClick) {
      if (this.props.menuItemsSource === MenuItemsSource.DYNAMIC) {
        const currentItem = this.props.sourceData?.[index]
          ? this.props.sourceData[index]
          : {};

        super.executeAction({
          triggerPropertyName: "onClick",
          dynamicString: onClick,
          event: {
            type: EventType.ON_CLICK,
          },
          globalContext: { currentItem, currentIndex: index },
        });
      } else if (this.props.menuItemsSource === MenuItemsSource.STATIC) {
        super.executeAction({
          triggerPropertyName: "onClick",
          dynamicString: onClick,
          event: {
            type: EventType.ON_CLICK,
          },
        });
      }
    }
  };

  getSourceDataKeys = () => {
    if (!this.props.sourceData?.length) {
      return [];
    }

    const allKeys: string[] = [];

    // get all keys
    this.props.sourceData.forEach((item) => allKeys.push(...Object.keys(item)));

    // return unique keys
    return [...new Set(allKeys)];
  };

  createInitialDynamicMenuItemsProperties = () => {
    if (!("sourceData" in this.props)) {
      super.updateWidgetProperty("sourceData", []);
      super.updateWidgetProperty("sourceDataKeys", this.getSourceDataKeys());
    }

    if (!("configureMenuItems" in this.props)) {
      super.updateWidgetProperty("configureMenuItems", {
        label: "Configure Menu Items",
        id: "config",
        config: {
          id: "config",
          label: "",
          isVisible: true,
          isDisabled: false,
        },
      });
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
    }

    if (menuItemsSource === MenuItemsSource.DYNAMIC && sourceData?.length) {
      const getValue = (property: string, index: number) => {
        const propertyName = property as keyof typeof configureMenuItems.config;

        if (isArray(configureMenuItems.config[propertyName])) {
          return configureMenuItems.config[propertyName][index];
        }

        return configureMenuItems.config[propertyName]
          ? configureMenuItems.config[propertyName]
          : null;
      };

      const visibleItems = sourceData
        .map((item, index) => ({
          ...item,
          isVisible: getValue("isVisible", index),
          isDisabled: getValue("isDisabled", index),
          index: index,
          widgetId: "",
          label: getValue("label", index),
          onClick: configureMenuItems?.config?.onClick,
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
    super.updateWidgetProperty("sourceDataKeys", this.getSourceDataKeys());
  };

  componentDidUpdate = (prevProps: MenuButtonWidgetProps) => {
    if (!equal(prevProps.sourceData, this.props.sourceData)) {
      super.updateWidgetProperty("sourceDataKeys", this.getSourceDataKeys());
    }

    if (!equal(prevProps.menuItemsSource, this.props.menuItemsSource)) {
      this.createInitialDynamicMenuItemsProperties();
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
