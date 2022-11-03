import React from "react";
import BaseWidget, { WidgetState } from "widgets/BaseWidget";
import {
  EventType,
  ExecuteTriggerPayload,
} from "constants/AppsmithActionConstants/ActionConstants";
import MenuButtonComponent from "../component";
import { MinimumPopupRows } from "widgets/constants";
import { MenuButtonWidgetProps, MenuItemsSource } from "../constants";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";
import equal from "fast-deep-equal/es6";
import { isArray, orderBy } from "lodash";
import { getSourceDataKeys } from "./helper";

class MenuButtonWidget extends BaseWidget<MenuButtonWidgetProps, WidgetState> {
  static getPropertyPaneContentConfig() {
    return contentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
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
          currentItem: this.props.sourceData?.[index]
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
      sourceData?.length
    ) {
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
