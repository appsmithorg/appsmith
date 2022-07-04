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
import formControlTypes from "./formControlTypes";

/**
 * NOTE: If you are adding a component that uses FormControl
 * then add logic for creating reactivePaths in recursiveFindReactivePaths() at entities/Action/actionProperties.ts
 */
class FormControlRegistry {
  static registerFormControlBuilders() {
    FormControlFactory.registerControlBuilder(formControlTypes.INPUT_TEXT, {
      buildPropertyControl(controlProps: InputControlProps): JSX.Element {
        return <InputTextControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(
      formControlTypes.FIXED_KEY_INPUT,
      {
        buildPropertyControl(
          controlProps: FixedKeyInputControlProps,
        ): JSX.Element {
          //TODO: may not be in use
          return <FixedKeyInputControl {...controlProps} />;
        },
      },
    );
    FormControlFactory.registerControlBuilder(formControlTypes.DROP_DOWN, {
      buildPropertyControl(controlProps: DropDownControlProps): JSX.Element {
        return <DropDownControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(formControlTypes.SWITCH, {
      buildPropertyControl(controlProps: SwitchControlProps): JSX.Element {
        return <SwitchControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(formControlTypes.KEYVALUE_ARRAY, {
      buildPropertyControl(
        controlProps: KeyValueArrayControlProps,
      ): JSX.Element {
        return <KeyValueArrayControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(formControlTypes.FILE_PICKER, {
      buildPropertyControl(controlProps: FilePickerControlProps): JSX.Element {
        //used by redshift datasource
        return <FilePickerControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(formControlTypes.KEY_VAL_INPUT, {
      //TODO: may not be in use, replace it with KeyValueArrayControl
      buildPropertyControl(
        controlProps: KeyValueInputControlProps,
      ): JSX.Element {
        return <KeyValueInputControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(
      formControlTypes.QUERY_DYNAMIC_TEXT,
      {
        buildPropertyControl(controlProps: DynamicTextFieldProps): JSX.Element {
          return <DynamicTextControl {...controlProps} />;
        },
      },
    );
    FormControlFactory.registerControlBuilder(
      formControlTypes.QUERY_DYNAMIC_INPUT_TEXT,
      {
        buildPropertyControl(
          controlProps: DynamicInputControlProps,
        ): JSX.Element {
          return <DynamicInputTextControl {...controlProps} />;
        },
      },
    );
    FormControlFactory.registerControlBuilder(formControlTypes.CHECKBOX, {
      buildPropertyControl(controlProps: CheckboxControlProps): JSX.Element {
        //used in API datasource form only
        return <CheckboxControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(formControlTypes.NUMBER_INPUT, {
      buildPropertyControl(controlProps: InputControlProps): JSX.Element {
        return <InputTextControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(formControlTypes.ARRAY_FIELD, {
      buildPropertyControl(controlProps: FieldArrayControlProps): JSX.Element {
        return <FieldArrayControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(formControlTypes.WHERE_CLAUSE, {
      buildPropertyControl(controlProps: WhereClauseControlProps): JSX.Element {
        return <WhereClauseControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(
      formControlTypes.ENTITY_SELECTOR,
      {
        buildPropertyControl(
          controlProps: EntitySelectorControlProps,
        ): JSX.Element {
          return <EntitySelectorControl {...controlProps} />;
        },
      },
    );

    FormControlFactory.registerControlBuilder(formControlTypes.PAGINATION, {
      buildPropertyControl(controlProps: PaginationControlProps): JSX.Element {
        return <PaginationControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(formControlTypes.SORTING, {
      buildPropertyControl(controlProps: SortingControlProps): JSX.Element {
        return <SortingControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(formControlTypes.PROJECTION, {
      buildPropertyControl(controlProps: DropDownControlProps): JSX.Element {
        return (
          <DropDownControl
            // I'm keeping the first condition "!!controlProps?.fetchOptionsConditionally" in case we want to pass in this props manually from inside one of the other form controls
            // for example in the EntitySelectorControl.tsx file in the dropdownFieldConfig object.
            fetchOptionsConditionally={
              !!controlProps?.fetchOptionsConditionally ||
              !!controlProps?.conditionals?.fetchDynamicValues?.condition
            }
            isMultiSelect
            isSearchable
            {...controlProps}
          />
        );
      },
    });
  }
}

export default FormControlRegistry;
