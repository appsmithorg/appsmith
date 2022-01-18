import React from "react";
import FormControlFactory from "./FormControlFactory";
import FixedKeyInputControl, {
  FixedKeyInputControlProps,
} from "components/formControls/FixedKeyInputControl";
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
  KeyValueArrayControlProps,
} from "components/formControls/KeyValueArrayControl";
import KeyValueInputControl, {
  KeyValueInputControlProps,
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
import DynamicInputTextControl, {
  DynamicInputControlProps,
} from "components/formControls/DynamicInputTextControl";
import FieldArrayControl, {
  FieldArrayControlProps,
} from "components/formControls/FieldArrayControl";
import WhereClauseControl, {
  WhereClauseControlProps,
} from "components/formControls/WhereClauseControl";
import PaginationControl, {
  PaginationControlProps,
} from "components/formControls/PaginationControl";
import SortingControl, {
  SortingControlProps,
} from "components/formControls/SortingControl";
import EntitySelectorControl, {
  EntitySelectorControlProps,
} from "components/formControls/EntitySelectorControl";
import ProjectionSelectorControl, {
  ProjectionSelectorControlProps,
} from "components/formControls/ProjectionSelectorControl";

class FormControlRegistry {
  static registerFormControlBuilders() {
    FormControlFactory.registerControlBuilder("INPUT_TEXT", {
      buildPropertyControl(controlProps: InputControlProps): JSX.Element {
        return <InputTextControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("FIXED_KEY_INPUT", {
      buildPropertyControl(
        controlProps: FixedKeyInputControlProps,
      ): JSX.Element {
        //TODO: may not be in use
        return <FixedKeyInputControl {...controlProps} />;
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
      buildPropertyControl(
        controlProps: KeyValueArrayControlProps,
      ): JSX.Element {
        return <KeyValueArrayControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("FILE_PICKER", {
      buildPropertyControl(controlProps: FilePickerControlProps): JSX.Element {
        //used by redshift datasource
        return <FilePickerControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("KEY_VAL_INPUT", {
      //TODO: may not be in use, replace it with KeyValueArrayControl
      buildPropertyControl(
        controlProps: KeyValueInputControlProps,
      ): JSX.Element {
        return <KeyValueInputControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("QUERY_DYNAMIC_TEXT", {
      buildPropertyControl(controlProps: DynamicTextFieldProps): JSX.Element {
        return <DynamicTextControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("QUERY_DYNAMIC_INPUT_TEXT", {
      buildPropertyControl(
        controlProps: DynamicInputControlProps,
      ): JSX.Element {
        return <DynamicInputTextControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("CHECKBOX", {
      buildPropertyControl(controlProps: CheckboxControlProps): JSX.Element {
        //used in API datasource form only
        return <CheckboxControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("NUMBER_INPUT", {
      buildPropertyControl(controlProps: InputControlProps): JSX.Element {
        return <InputTextControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("ARRAY_FIELD", {
      buildPropertyControl(controlProps: FieldArrayControlProps): JSX.Element {
        return <FieldArrayControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("WHERE_CLAUSE", {
      buildPropertyControl(controlProps: WhereClauseControlProps): JSX.Element {
        return <WhereClauseControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("ENTITY_SELECTOR", {
      buildPropertyControl(
        controlProps: EntitySelectorControlProps,
      ): JSX.Element {
        return <EntitySelectorControl {...controlProps} />;
      },
    });

    FormControlFactory.registerControlBuilder("PAGINATION", {
      buildPropertyControl(controlProps: PaginationControlProps): JSX.Element {
        return <PaginationControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("SORTING", {
      buildPropertyControl(controlProps: SortingControlProps): JSX.Element {
        return <SortingControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder("PROJECTION", {
      buildPropertyControl(
        controlProps: ProjectionSelectorControlProps,
      ): JSX.Element {
        return <ProjectionSelectorControl {...controlProps} />;
      },
    });
  }
}

export default FormControlRegistry;
