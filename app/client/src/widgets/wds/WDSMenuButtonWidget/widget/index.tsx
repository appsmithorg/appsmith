import React, { type Key } from "react";
import { isArray, orderBy } from "lodash";
import BaseWidget from "widgets/BaseWidget";
import type { WidgetState } from "widgets/BaseWidget";
import type { SetterConfig } from "entities/AppTheming";
import {
  EventType,
  type ExecuteTriggerPayload,
} from "constants/AppsmithActionConstants/ActionConstants";
import type { AnvilConfig } from "WidgetProvider/constants";
import { Button, MenuTrigger, Menu, MenuItem } from "@appsmith/wds";

import * as config from "../config";
import type { MenuButtonWidgetProps } from "./types";

class WDSMenuButtonWidget extends BaseWidget<
  MenuButtonWidgetProps,
  WidgetState
> {
  constructor(props: MenuButtonWidgetProps) {
    super(props);
  }

  static type = "WDS_MENU_BUTTON_WIDGET";

  static getConfig() {
    return config.metaConfig;
  }

  static getDefaults() {
    return config.defaultsConfig;
  }

  static getAnvilConfig(): AnvilConfig | null {
    return config.anvilConfig;
  }

  static getAutocompleteDefinitions() {
    return config.autocompleteConfig;
  }

  static getPropertyPaneContentConfig() {
    return config.propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return config.propertyPaneStyleConfig;
  }

  static getSetterConfig(): SetterConfig {
    return config.settersConfig;
  }

  static getMethods() {
    return config.methodsConfig;
  }

  onMenuItemClick = (onClick: string | undefined, index: number) => {
    if (onClick) {
      const config: ExecuteTriggerPayload = {
        triggerPropertyName: "onClick",
        dynamicString: onClick,
        event: {
          type: EventType.ON_CLICK,
        },
      };

      // in case when the menu items source is dynamic, we need to pass the current item to the global context
      // the reason is in onClick, we can access the current item and current index by writing `{{currentItem}}` and `{{currentIndex}}`,
      // so we need to pass the current item to the global context
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
    }

    if (
      menuItemsSource === "dynamic" &&
      isArray(sourceData) &&
      sourceData?.length &&
      configureMenuItems?.config
    ) {
      const { config } = configureMenuItems;

      const getDynamicMenuItemValue = (
        propertyName: keyof typeof config,
        index: number,
      ) => {
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
          isVisible: getDynamicMenuItemValue("isVisible", index),
          isDisabled: getDynamicMenuItemValue("isDisabled", index),
          index: index,
          widgetId: "",
          label: getDynamicMenuItemValue("label", index),
          onClick: config?.onClick,
        }))
        .filter((item) => item.isVisible === true);

      return visibleItems;
    }

    return [];
  };

  getWidgetView() {
    const {
      disableWidgetInteraction,
      isDisabled,
      label,
      triggerButtonColor,
      triggerButtonIconAlign,
      triggerButtonIconName,
      triggerButtonVariant,
    } = this.props;

    const visibleItems = this.getVisibleItems();
    const disabledKeys = visibleItems
      .filter((item) => item.isDisabled === true)
      .map((item) => item.id);

    return (
      <MenuTrigger>
        <Button
          color={triggerButtonColor}
          excludeFromTabOrder={disableWidgetInteraction}
          icon={triggerButtonIconName}
          iconPosition={triggerButtonIconAlign}
          isDisabled={isDisabled}
          variant={triggerButtonVariant}
        >
          {label}
        </Button>

        <Menu
          disabledKeys={disabledKeys as Iterable<Key>}
          onAction={(key) => {
            const clickedItemIndex = visibleItems.findIndex(
              (item) => item.id === key,
            );

            if (clickedItemIndex > -1) {
              this.onMenuItemClick(
                visibleItems[clickedItemIndex]?.onClick,
                clickedItemIndex,
              );
            }
          }}
        >
          {visibleItems.map((item) => (
            <MenuItem
              id={item.id as Key}
              key={item.id as Key}
              textValue={item.label}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      </MenuTrigger>
    );
  }
}

export { WDSMenuButtonWidget };
