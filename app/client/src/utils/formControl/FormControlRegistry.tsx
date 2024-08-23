import React from "react";
import FormControlFactory from "./FormControlFactory";
import type { FixedKeyInputControlProps } from "components/formControls/FixedKeyInputControl";
import FixedKeyInputControl from "components/formControls/FixedKeyInputControl";
import type { InputControlProps } from "components/formControls/InputTextControl";
import InputTextControl from "components/formControls/InputTextControl";
import type { DropDownControlProps } from "components/formControls/DropDownControl";
import DropDownControl from "components/formControls/DropDownControl";
import type { SwitchControlProps } from "components/formControls/SwitchControl";
import SwitchControl from "components/formControls/SwitchControl";
import type { KeyValueArrayControlProps } from "components/formControls/KeyValueArrayControl";
import KeyValueArrayControl from "components/formControls/KeyValueArrayControl";
import type { FilePickerControlProps } from "components/formControls/FilePickerControl";
import FilePickerControl from "components/formControls/FilePickerControl";
import type { DynamicTextFieldProps } from "components/formControls/DynamicTextFieldControl";
import DynamicTextControl from "components/formControls/DynamicTextFieldControl";
import type { CheckboxControlProps } from "components/formControls/CheckboxControl";
import CheckboxControl from "components/formControls/CheckboxControl";
import type { DynamicInputControlProps } from "components/formControls/DynamicInputTextControl";
import DynamicInputTextControl from "components/formControls/DynamicInputTextControl";
import type { FieldArrayControlProps } from "components/formControls/FieldArrayControl";
import FieldArrayControl from "components/formControls/FieldArrayControl";
import type { WhereClauseControlProps } from "components/formControls/WhereClauseControl";
import WhereClauseControl from "components/formControls/WhereClauseControl";
import type { PaginationControlProps } from "components/formControls/PaginationControl";
import PaginationControl from "components/formControls/PaginationControl";
import type { SortingControlProps } from "components/formControls/SortingControl";
import SortingControl from "components/formControls/SortingControl";
import type { EntitySelectorControlProps } from "components/formControls/EntitySelectorControl";
import EntitySelectorControl from "components/formControls/EntitySelectorControl";
import { FormControlTypes } from "@appsmith/types";
import SegmentedControl from "components/formControls/SegmentedControl";
import type { SegmentedControlProps } from "components/formControls/SegmentedControl";
import FormTemplateControl from "components/formControls/FormTemplateControl";
import type { FormTemplateControlProps } from "components/formControls/FormTemplateControl";
import MultiFilePickerControl from "components/formControls/MultiFilePickerControl";
import type { MultipleFilePickerControlProps } from "components/formControls/MultiFilePickerControl";

/**
 * NOTE: If you are adding a component that uses FormControl
 * then add logic for creating reactivePaths in recursiveFindReactivePaths() at entities/Action/actionProperties.ts
 */
class FormControlRegistry {
  static registerFormControlBuilders() {
    FormControlFactory.registerControlBuilder(FormControlTypes.INPUT_TEXT, {
      buildPropertyControl(controlProps: InputControlProps): JSX.Element {
        return <InputTextControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(
      FormControlTypes.FIXED_KEY_INPUT,
      {
        buildPropertyControl(
          controlProps: FixedKeyInputControlProps,
        ): JSX.Element {
          //TODO: may not be in use
          return <FixedKeyInputControl {...controlProps} />;
        },
      },
    );
    FormControlFactory.registerControlBuilder(
      FormControlTypes.SEGMENTED_CONTROL,
      {
        buildPropertyControl(controlProps: SegmentedControlProps): JSX.Element {
          return <SegmentedControl {...controlProps} />;
        },
      },
    );
    FormControlFactory.registerControlBuilder(FormControlTypes.DROP_DOWN, {
      buildPropertyControl(controlProps: DropDownControlProps): JSX.Element {
        return <DropDownControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(FormControlTypes.SWITCH, {
      buildPropertyControl(controlProps: SwitchControlProps): JSX.Element {
        return <SwitchControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(FormControlTypes.KEYVALUE_ARRAY, {
      buildPropertyControl(
        controlProps: KeyValueArrayControlProps,
      ): JSX.Element {
        return <KeyValueArrayControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(FormControlTypes.FILE_PICKER, {
      buildPropertyControl(controlProps: FilePickerControlProps): JSX.Element {
        //used by redshift datasource
        return <FilePickerControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(
      FormControlTypes.QUERY_DYNAMIC_TEXT,
      {
        buildPropertyControl(controlProps: DynamicTextFieldProps): JSX.Element {
          return <DynamicTextControl {...controlProps} />;
        },
      },
    );
    FormControlFactory.registerControlBuilder(
      FormControlTypes.QUERY_DYNAMIC_INPUT_TEXT,
      {
        buildPropertyControl(
          controlProps: DynamicInputControlProps,
        ): JSX.Element {
          return <DynamicInputTextControl {...controlProps} />;
        },
      },
    );
    FormControlFactory.registerControlBuilder(FormControlTypes.CHECKBOX, {
      buildPropertyControl(controlProps: CheckboxControlProps): JSX.Element {
        //used in API datasource form only
        return <CheckboxControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(FormControlTypes.NUMBER_INPUT, {
      buildPropertyControl(controlProps: InputControlProps): JSX.Element {
        return <InputTextControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(FormControlTypes.ARRAY_FIELD, {
      buildPropertyControl(controlProps: FieldArrayControlProps): JSX.Element {
        return <FieldArrayControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(FormControlTypes.WHERE_CLAUSE, {
      buildPropertyControl(controlProps: WhereClauseControlProps): JSX.Element {
        return <WhereClauseControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(
      FormControlTypes.ENTITY_SELECTOR,
      {
        buildPropertyControl(
          controlProps: EntitySelectorControlProps,
        ): JSX.Element {
          return <EntitySelectorControl {...controlProps} />;
        },
      },
    );

    FormControlFactory.registerControlBuilder(FormControlTypes.PAGINATION, {
      buildPropertyControl(controlProps: PaginationControlProps): JSX.Element {
        return <PaginationControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(FormControlTypes.SORTING, {
      buildPropertyControl(controlProps: SortingControlProps): JSX.Element {
        return <SortingControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(FormControlTypes.PROJECTION, {
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
    FormControlFactory.registerControlBuilder(FormControlTypes.FORM_TEMPLATE, {
      buildPropertyControl(
        controlProps: FormTemplateControlProps,
      ): JSX.Element {
        return <FormTemplateControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(
      FormControlTypes.MULTIPLE_FILE_PICKER,
      {
        buildPropertyControl(
          controlProps: MultipleFilePickerControlProps,
        ): JSX.Element {
          return <MultiFilePickerControl {...controlProps} />;
        },
      },
    );
  }
}

export default FormControlRegistry;
