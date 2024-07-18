import React, { useCallback, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getFloatingPaneSelectedWidget } from "./selectors";
import WidgetFactory from "WidgetProvider/factory";
import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import {
  Button,
  Flex,
  Menu,
  MenuContent,
  MenuGroup,
  MenuGroupName,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "design-system";
import { ControlContext } from "./ControlContext";
import { updateFloatingPane } from "./actions";
import history from "utils/history";
import { widgetURL } from "@appsmith/RouteBuilder";

const PropertySelector = () => {
  const [showMenu, setShowMenu] = useState(false);
  const widget = useSelector(getFloatingPaneSelectedWidget);
  const { selectedControl, setSelectedControl } = useContext(ControlContext);
  const config: readonly PropertyPaneConfig[] =
    WidgetFactory.getWidgetFloatPropertyPaneConfig(widget.type);
  const dispatch = useDispatch();

  const handleClose = useCallback(() => {
    dispatch(updateFloatingPane({ isVisible: false, selectedWidgetId: "0" }));
  }, [dispatch]);

  const selectWidget = useCallback(() => {
    handleClose();
    history.push(widgetURL({ selectedWidgets: [widget.widgetId] }));
  }, [handleClose, widget.widgetId]);

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
    if (firstControl) {
      handleMenuSelection(firstControl);
    }
  }, [widget.widgetId, config, handleMenuSelection]);

  return (
    <Flex alignItems="center" justifyContent="space-between">
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
      <Flex gap="spacing-2">
        <Button
          kind="tertiary"
          onClick={selectWidget}
          size="sm"
          startIcon="maximize-v3"
        />
        <Button
          kind="tertiary"
          onClick={handleClose}
          size="sm"
          startIcon="close-line"
        />
      </Flex>
    </Flex>
  );
};

export default PropertySelector;
