import React, { useCallback, useContext, useState } from "react";
import { useSelector } from "react-redux";
import { getFloatingPaneSelectedWidget } from "./selectors";
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

const PropertySelector = () => {
  const [showMenu, setShowMenu] = useState(false);
  const { selectedControl, setSelectedControl } = useContext(ControlContext);
  const widget = useSelector(getFloatingPaneSelectedWidget);
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

  return (
    <Menu onOpenChange={setShowMenu} open={showMenu}>
      <MenuTrigger>
        <Button
          endIcon="dropdown"
          kind="tertiary"
          onClick={() => setShowMenu(true)}
        >
          {selectedControl?.label}
        </Button>
      </MenuTrigger>
      <MenuContent>
        {config.map((group: PropertyPaneConfig) => {
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
                <MenuSeparator />
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
