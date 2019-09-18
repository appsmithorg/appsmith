import React from "react";
import PropertyControlFactory from "./PropertyControlFactory";
import InputTextControl, {
  InputControlProps,
} from "../pages/propertyControls/InputTextControl";
import DropDownControl, {
  DropDownControlProps,
} from "../pages/propertyControls/DropDownControl";

class PropertyControlRegistry {
  static registerPropertyControlBuilders() {
    PropertyControlFactory.registerControlBuilder("INPUT_TEXT", {
      buildPropertyControl(controlProps: InputControlProps): JSX.Element {
        return <InputTextControl {...controlProps} />;
      },
    });
    PropertyControlFactory.registerControlBuilder("DROP_DOWN", {
      buildPropertyControl(controlProps: DropDownControlProps): JSX.Element {
        return <DropDownControl {...controlProps} />;
      },
    });
  }
}

export default PropertyControlRegistry;
