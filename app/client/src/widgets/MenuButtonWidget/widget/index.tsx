import type { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { Stylesheet } from "entities/AppTheming";
import { isArray, orderBy } from "lodash";
import { default as React } from "react";
import type { WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import { MinimumPopupRows } from "widgets/constants";
import MenuButtonComponent from "../component";
import type { MenuButtonWidgetProps, MenuItem } from "../constants";
import { MenuItemsSource } from "../constants";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";

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
