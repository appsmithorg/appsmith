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
import MultiSelectControl, {
  MultiSelectControlProps,
} from "../components/propertyControls/MultiSelectControl";
import DatePickerControl, {
  DatePickerControlProps,
} from "../components/propertyControls/DatePickerControl";
import TimeZoneControl, {
  TimeZoneControlProps,
} from "../components/propertyControls/TimezoneControl";
import ActionSelectorControl from "../components/propertyControls/ActionSelector";

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
    PropertyControlFactory.registerControlBuilder("MULTI_SELECT", {
      buildPropertyControl(controlProps: MultiSelectControlProps): JSX.Element {
        return <MultiSelectControl {...controlProps} />;
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
    PropertyControlFactory.registerControlBuilder("DATE_PICKER", {
      buildPropertyControl(controlProps: DatePickerControlProps): JSX.Element {
        return <DatePickerControl {...controlProps} />;
      },
    });
    PropertyControlFactory.registerControlBuilder("TIMEZONE_PICKER", {
      buildPropertyControl(controlProps: TimeZoneControlProps): JSX.Element {
        return <TimeZoneControl {...controlProps} />;
      },
    });
    PropertyControlFactory.registerControlBuilder("ACTION_SELECTOR", {
      buildPropertyControl(controlProps: ControlProps): JSX.Element {
        return <ActionSelectorControl {...controlProps} />;
      },
    });
  }
}

export default PropertyControlRegistry;
