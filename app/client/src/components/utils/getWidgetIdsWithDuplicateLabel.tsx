import type { ControlProps } from "../propertyControls/BaseControl";
import includes from "lodash/includes";
import type { MenuItem } from "../propertyControls/MenuItemsControl";
import type { MenuItem as ButtonMenuItem } from "../propertyControls/ButtonListControl";

//This function is used to get the widget ids with duplicate labels
export const getduplicateLabelWidgetIds = (
  propertyValue: ControlProps["propertyValue"],
) => {
  const duplicateLabelWidgetIds = [];
  const widgetIds = Object.keys(propertyValue);
  for (let index = 0; index < widgetIds.length; index++) {
    if (propertyValue[widgetIds[index]].isDuplicateLabel) {
      duplicateLabelWidgetIds.push(propertyValue[widgetIds[index]].id);
    }
  }
  return duplicateLabelWidgetIds;
};
//This function is used to get the widget ids with duplicate labels when updated and update the isDuplicateLabel property
export const getWidgetIdsWithDuplicateLabelWhenUpdated = (
  duplicateIds: string[],
  labels: string[],
  updatedLabel: string,
  widgetId: string,
  index: number,
  updateMenuProperty: (widgetId: string, isDuplicate?: boolean) => void,
  items: (MenuItem | ButtonMenuItem)[],
) => {
  let duplicateMenuButtonIds = [...duplicateIds];
  if (includes(labels, updatedLabel)) {
    duplicateMenuButtonIds.push(widgetId);
    updateMenuProperty(widgetId, true);
  } else {
    duplicateMenuButtonIds = duplicateMenuButtonIds.filter(
      (id) => id !== widgetId,
    );
    updateMenuProperty(widgetId);
  }
  const widgetIdToLabelMap = new Map<string, string>();
  items.forEach((item) => {
    widgetIdToLabelMap.set(item.id, item.label);
  });
  labels[index] = updatedLabel;
  widgetIdToLabelMap.set(widgetId, updatedLabel);
  const DuplicateId: string[] = [];
  duplicateMenuButtonIds.forEach((id: string) => {
    let count = 0;
    labels.forEach((label) => {
      if (label === widgetIdToLabelMap.get(id)) {
        count++;
      }
    });
    if (count > 1) {
      DuplicateId.push(id);
    } else {
      updateMenuProperty(id);
    }
  });
  return DuplicateId;
};

export const onDeleteGetDuplicateIds = (
  updatedobj: (ButtonMenuItem | MenuItem)[],
  duplicateIds: string[],
  labels: string[],
  updateMenuProperty: (widgetId: string, isDuplicate?: boolean) => void,
) => {
  const duplicateMenuButtonIds = [...duplicateIds];
  const widgetIdToLabelMap = new Map<string, string>();
  updatedobj.forEach((item) => {
    widgetIdToLabelMap.set(item.id, item.label);
  });
  const DuplicateId: string[] = [];
  duplicateMenuButtonIds.forEach((id: string) => {
    let count = 0;
    labels.forEach((label) => {
      if (label === widgetIdToLabelMap.get(id)) {
        count++;
      }
    });
    if (count > 1) {
      DuplicateId.push(id);
    } else {
      updateMenuProperty(id);
    }
  });
  return DuplicateId;
};


//This function is used to update the isDuplicateLabel property of the button and menu items when it is edited from input text control.
export const onUpdatedlabel = (
  widgetId: string,
  state: any,
  groupButtons: any,
  propertyName: string,
  updatedLabel: string,
  updateProperty: (
    propertyName: string,
    value: any,
    isDynamicTrigger?: boolean,
  ) => void,
) => {
  const widget = state.entities.canvasWidgets[widgetId];
  const buttonId = Object.keys(groupButtons)[0];
  if (Object.keys(groupButtons[buttonId]).includes("label")) {
    const buttonStructure = propertyName.split(".");
    buttonStructure.pop();
    const buttonStructureString = buttonStructure.join(".");
    const buttonIds = Object.keys(widget.groupButtons);
    const buttonNames = buttonIds.map(
      (buttonId) => widget.groupButtons[buttonId].label,
    );
    //Check if the updated label is already present in the button labels
    if (buttonNames.includes(updatedLabel)) {
      updateProperty(`${buttonStructureString}.isDuplicateLabel`, true);
    } else if (widget.groupButtons[buttonId].isDuplicateLabel) {
      //Check if the isDuplicateLabel property is true for the button and the updated label is not present in the button labels
      updateProperty(
        `${buttonStructure[0]}.${buttonId}.isDuplicateLabel`,
        false,
      );
    }
    const index = buttonIds.indexOf(buttonId);
    buttonNames[index] = updatedLabel;
    const duplicateIds = buttonIds.filter(
      (buttonId) => widget.groupButtons[buttonId].isDuplicateLabel,
    );
    //remove the isDuplicateLabel property if the label is not duplicate due to the edit
    duplicateIds.forEach((id: string) => {
      let count = 0;
      buttonNames.forEach((label) => {
        if (label === widget.groupButtons[id].label) {
          count++;
        }
      });
      if (count == 1) {
        updateProperty(`${buttonStructure[0]}.${id}.isDuplicateLabel`, false);
      }
    });
  } else {
    const menuStructure = propertyName.split(".");
    menuStructure.pop();
    const menuId = menuStructure.pop()!;
    const menuStructureString = menuStructure.join(".");
    const menuIds = Object.keys(widget.groupButtons[buttonId].menuItems);
    const menuNames = menuIds.map(
      (id) => widget.groupButtons[buttonId].menuItems[id].label,
    );
    //Check if the updated label is already present in the menu labels
    if (menuNames.includes(updatedLabel)) {
      updateProperty(`${menuStructureString}.${menuId}.isDuplicateLabel`, true);
    } else if (
      widget.groupButtons[buttonId].menuItems[menuId].isDuplicateLabel
    ) {
      //Check if the isDuplicateLabel property is true for the menu item and the updated label is not present in the menu labels
      updateProperty(
        `${menuStructureString}.${menuId}.isDuplicateLabel`,
        false,
      );
    }
    const index = menuIds.indexOf(menuId);
    menuNames[index] = updatedLabel;
    const duplicateIds = menuIds.filter(
      (menuId) =>
        widget.groupButtons[buttonId].menuItems[menuId].isDuplicateLabel,
    );
    //remove the isDuplicateLabel property if the label is not duplicate due to the edit
    duplicateIds.forEach((id: string) => {
      let count = 0;
      menuNames.forEach((label) => {
        if (label === widget.groupButtons[buttonId].menuItems[id].label) {
          count++;
        }
      });
      if (count === 1) {
        updateProperty(`${menuStructureString}.${id}.isDuplicateLabel`, false);
      }
    });
  }
};
