import React from "react";
import type { SetterConfig } from "entities/AppTheming";
import type { WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import {
  metaConfig,
  defaultsConfig,
  autocompleteConfig,
  propertyPaneContentConfig,
  propertyPaneStyleConfig,
  settersConfig,
  methodsConfig,
} from "../config";
import type { AnvilConfig } from "WidgetProvider/constants";
import { Button, Item, Menu, MenuList } from "@design-system/widgets";
import { isArray, orderBy } from "lodash";
import type { MenuButtonWidgetProps, MenuItem } from "./types";
import {
  EventType,
  type ExecuteTriggerPayload,
} from "constants/AppsmithActionConstants/ActionConstants";

class WDSMenuButtonWidget extends BaseWidget<
  MenuButtonWidgetProps,
  WidgetState
> {
  constructor(props: MenuButtonWidgetProps) {
    super(props);

    this.state = {
      isLoading: false,
    };
  }

  static type = "WDS_MENU_BUTTON_WIDGET";

  static getConfig() {
    return metaConfig;
  }

  static getDefaults() {
    return defaultsConfig;
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxWidth: {
          base: "100%",
          "280px": "sizing-70",
        },
        minWidth: "sizing-14",
      },
    };
  }

  static getAutocompleteDefinitions() {
    return autocompleteConfig;
  }

  static getPropertyPaneContentConfig() {
    return propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return propertyPaneStyleConfig;
  }

  static getSetterConfig(): SetterConfig {
    return settersConfig;
  }

  static getMethods() {
    return methodsConfig;
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

      if (this.props.menuItemsSource === "dynamic") {
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

    if (menuItemsSource === "static") {
      const visibleItems = Object.keys(menuItems)
        .map((itemKey) => menuItems[itemKey])
        .filter((item) => item.isVisible === true);

      return orderBy(visibleItems, ["index"], ["asc"]);
    } else if (
      menuItemsSource === "dynamic" &&
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
          iconAlign: getValue("iconAlign", index),
          iconName: getValue("iconName", index),
          textColor: getValue("textColor", index),
        }))
        .filter((item) => item.isVisible === true);

      return visibleItems;
    }

    return [];
  };

  getWidgetView() {
    const {
      isDisabled,
      label,
      triggerButtonColor,
      triggerButtonIconAlign,
      triggerButtonIconName,
      triggerButtonVariant,
    } = this.props;

    const visibleItems: MenuItem[] = this.getVisibleItems();
    const disabledKeys = visibleItems
      .filter((item) => item.isDisabled === true)
      .map((item) => item.id);

    return (
      <Menu
        disabledKeys={disabledKeys}
        onAction={(key) => {
          const clickedItemIndex = visibleItems.findIndex(
            (item) => item.id === key,
          );

          if (clickedItemIndex > -1) {
            this.menuItemClickHandler(
              visibleItems[clickedItemIndex]?.onClick,
              clickedItemIndex,
            );
          }
        }}
      >
        <Button
          color={triggerButtonColor}
          icon={triggerButtonIconName}
          iconPosition={triggerButtonIconAlign}
          isDisabled={isDisabled}
          variant={triggerButtonVariant}
        >
          {label}
        </Button>

        <MenuList>
          {visibleItems.map((menuItem: MenuItem) => (
            <Item key={menuItem.id}>{menuItem.label}</Item>
          ))}
        </MenuList>
      </Menu>
    );
  }
}

export { WDSMenuButtonWidget };
