import React from "react";
import PropertyControlFactory from "./PropertyControlFactory";
import InputTextControl, {
  InputControlProps,
} from "../components/propertyControls/InputTextControl";
import DropDownControl, {
  DropDownControlProps,
} from "../components/propertyControls/DropDownControl";
import SwitchControl, {
  SwitchControlProps,
} from "../components/propertyControls/SwitchControl";
import OptionControl from "../components/propertyControls/OptionControl";
import { ControlProps } from "../components/propertyControls/BaseControl";
import CodeEditorControl from "../components/propertyControls/CodeEditorControl";

class PropertyControlRegistry {
  static registerPropertyControlBuilders() {
    PropertyControlFactory.registerControlBuilder("INPUT_TEXT", {
      buildPropertyControl(controlProps: InputControlProps): JSX.Element {
        return <InputTextControl {...controlProps} />;
      },
    });
    PropertyControlFactory.registerControlBuilder("CODE_EDITOR", {
      buildPropertyControl(controlProps: InputControlProps): JSX.Element {
        return <CodeEditorControl {...controlProps} />;
      },
    });
    PropertyControlFactory.registerControlBuilder("DROP_DOWN", {
      buildPropertyControl(controlProps: DropDownControlProps): JSX.Element {
        return <DropDownControl {...controlProps} />;
      },
    });
    PropertyControlFactory.registerControlBuilder("SWITCH", {
      buildPropertyControl(controlProps: SwitchControlProps): JSX.Element {
        return <SwitchControl {...controlProps} />;
      },
    });
    PropertyControlFactory.registerControlBuilder("OPTION_INPUT", {
      buildPropertyControl(controlProps: ControlProps): JSX.Element {
        return <OptionControl {...controlProps} />;
      },
    });
  }
}

export default PropertyControlRegistry;
