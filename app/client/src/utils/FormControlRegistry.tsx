import React from "react";
import FormControlFactory from "./FormControlFactory";
import InputTextControl, {
  InputControlProps,
} from "components/formControls/InputTextControl";
import DropDownControl, {
  DropDownControlProps,
} from "components/formControls/DropDownControl";
import SwitchControl, {
  SwitchControlProps,
} from "components/formControls/SwitchControl";
import KeyValueArrayControl, {
  KeyValueArrayProps,
} from "components/formControls/KeyValueArrayControl";
import KeyValueInputControl, {
  KeyValueInputProps,
} from "components/formControls/KeyValueInputControl";
import FilePickerControl, {
  FilePickerControlProps,
} from "components/formControls/FilePickerControl";
import DynamicTextControl, {
  DynamicTextFieldProps,
} from "components/formControls/DynamicTextFieldControl";
import CheckboxControl, {
  CheckboxControlProps,
} from "components/formControls/CheckboxControl";

class FormControlRegistry {
  static registerFormControlBuilders() {
    FormControlFactory.registerControlBuilder("INPUT_TEXT", {
      buildPropertyControl(controlProps: InputControlProps): JSX.Element {
        return <InputTextControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("DROP_DOWN", {
      buildPropertyControl(controlProps: DropDownControlProps): JSX.Element {
        return <DropDownControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("SWITCH", {
      buildPropertyControl(controlProps: SwitchControlProps): JSX.Element {
        return <SwitchControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("KEYVALUE_ARRAY", {
      buildPropertyControl(controlProps: KeyValueArrayProps): JSX.Element {
        return <KeyValueArrayControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("FILE_PICKER", {
      buildPropertyControl(controlProps: FilePickerControlProps): JSX.Element {
        return <FilePickerControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("KEY_VAL_INPUT", {
      buildPropertyControl(controlProps: KeyValueInputProps): JSX.Element {
        return <KeyValueInputControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("QUERY_DYNAMIC_TEXT", {
      buildPropertyControl(controlProps: DynamicTextFieldProps): JSX.Element {
        return <DynamicTextControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("CHECKBOX", {
      buildPropertyControl(controlProps: CheckboxControlProps): JSX.Element {
        return <CheckboxControl {...controlProps} />;
      },
    });
  }
}

export default FormControlRegistry;
