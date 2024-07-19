import React, { useCallback, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  getFloatingPaneInitProperty,
  getFloatingPaneSelectedWidget,
} from "./selectors";
import WidgetFactory from "WidgetProvider/factory";
import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import {
  Button,
  Menu,
  MenuContent,
  MenuGroup,
  MenuGroupName,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "design-system";
import { ControlContext } from "./ControlContext";

function findConfigByLabel(
  config: readonly PropertyPaneConfig[],
  name: string,
): PropertyPaneControlConfig | undefined {
  for (const section of config) {
    if (section.children) {
      for (const control of section.children) {
        if ("label" in control && control.label === name) {
          return control;
        }
      }
    }
  }
  return undefined; // Return null if no config with the given label is found
}

const PropertySelector = () => {
  const [showMenu, setShowMenu] = useState(false);
  const widget = useSelector(getFloatingPaneSelectedWidget);
  const initPropertyName = useSelector(getFloatingPaneInitProperty);
  const { selectedControl, setSelectedControl } = useContext(ControlContext);
  const config: readonly PropertyPaneConfig[] =
    WidgetFactory.getWidgetFloatPropertyPaneConfig(widget.type);

  const handleMenuSelection = useCallback(
    (controlConfig) => {
      if (setSelectedControl !== undefined) {
        setSelectedControl(controlConfig);
      }
    },
    [setSelectedControl],
  );

  useEffect(() => {
    const firstControl = config[0]?.children?.[0];
    let initControl: PropertyPaneControlConfig | undefined;
    if (initPropertyName) {
      initControl = findConfigByLabel(config, initPropertyName);
    }

    if (initControl) {
      handleMenuSelection(initControl);
    } else if (firstControl) {
      handleMenuSelection(firstControl);
    }
  }, [widget.widgetId, initPropertyName, config, handleMenuSelection]);

  return (
    <Menu onOpenChange={setShowMenu} open={showMenu}>
      <MenuTrigger>
        <Button
          endIcon="dropdown"
          kind="tertiary"
          onClick={() => setShowMenu(true)}
          startIcon="binding-new"
        >
          {selectedControl?.label}
        </Button>
      </MenuTrigger>
      <MenuContent className="!min-w-[200px]">
        {config.map((group: PropertyPaneConfig, index: number) => {
          if ((group as PropertyPaneSectionConfig).sectionName) {
            const sectionConfig: PropertyPaneSectionConfig =
              group as PropertyPaneSectionConfig;
            return (
              <MenuGroup key={sectionConfig.id}>
                <MenuGroupName>{sectionConfig.sectionName}</MenuGroupName>
                {sectionConfig.children &&
                  sectionConfig.children.map((control) => {
                    if ((control as PropertyPaneControlConfig).controlType) {
                      const controlConfig: PropertyPaneControlConfig =
                        control as PropertyPaneControlConfig;

                      return (
                        <MenuItem
                          key={controlConfig.id}
                          onClick={() => handleMenuSelection(controlConfig)}
                        >
                          {controlConfig.label}
                        </MenuItem>
                      );
                    }
                  })}
                {index <= config.length - 2 ? (
                  <MenuSeparator className="mb-2" />
                ) : null}
              </MenuGroup>
            );
          } else {
            return null;
          }
        })}
      </MenuContent>
    </Menu>
  );
};

export default PropertySelector;
