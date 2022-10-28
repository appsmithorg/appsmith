import React from "react";
import BaseWidget, { WidgetState } from "widgets/BaseWidget";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import MenuButtonComponent from "../component";
import { MinimumPopupRows } from "widgets/constants";
import { MenuButtonWidgetProps } from "../constants";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";

class MenuButtonWidget extends BaseWidget<MenuButtonWidgetProps, WidgetState> {
  static getPropertyPaneContentConfig() {
    return contentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

  menuItemClickHandler = (onClick: string | undefined, index: number) => {
    if (onClick) {
      const currentItem = this.props.sourceData?.[index];

      super.executeAction({
        triggerPropertyName: "onClick",
        dynamicString: onClick,
        event: {
          type: EventType.ON_CLICK,
        },
        globalContext: { currentItem, currentIndex: index },
      });
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

  componentDidMount = () => {
    super.updateWidgetProperty("sourceDataKeys", this.getSourceDataKeys());
  };

  componentDidUpdate = (prevProps: MenuButtonWidgetProps) => {
    const isSourceDataModified =
      JSON.stringify(prevProps.sourceData) !==
      JSON.stringify(this.props.sourceData);

    if (isSourceDataModified) {
      super.updateWidgetProperty("sourceDataKeys", this.getSourceDataKeys());
    }

    const hasMenuItemsSourceChanged =
      prevProps.menuItemsSource !== this.props.menuItemsSource;

    if (hasMenuItemsSourceChanged) {
      this.createInitialDynamicMenuItemsProperties();
    }
  };

  getPageView() {
    const { componentWidth } = this.getComponentDimensions();
    const menuDropDownWidth = MinimumPopupRows * this.props.parentColumnSpace;

    return (
      <MenuButtonComponent
        {...this.props}
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
