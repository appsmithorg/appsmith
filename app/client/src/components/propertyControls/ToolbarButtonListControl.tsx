import { generateReactKey } from "utils/generators";

import {
  createMessage,
  BUTTON_WIDGET_DEFAULT_LABEL,
} from "ee/constants/messages";
import ButtonListControl from "./ButtonListControl";

class ToolbarButtonListControl extends ButtonListControl {
  addOption = ({ isSeparator }: { isSeparator?: boolean }) => {
    let groupButtons = this.props.propertyValue;
    const groupButtonsArray = this.getMenuItems();
    const newGroupButtonId = generateReactKey({ prefix: "groupButton" });

    groupButtons = {
      ...groupButtons,
      [newGroupButtonId]: {
        id: newGroupButtonId,
        index: groupButtonsArray.length,
        label: isSeparator
          ? "Separator"
          : createMessage(BUTTON_WIDGET_DEFAULT_LABEL),
        widgetId: generateReactKey(),
        isDisabled: false,
        itemType: isSeparator ? "SEPARATOR" : "BUTTON",
        isVisible: true,
        icon: "thumb-up",
        isSeparator,
      },
    };

    this.updateProperty(this.props.propertyName, groupButtons);
  };

  static getControlType() {
    return "TOOLBAR_BUTTONS";
  }
}

export default ToolbarButtonListControl;
