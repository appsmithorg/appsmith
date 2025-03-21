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
import formControlTypes from "./formControlTypes";
import SegmentedControl from "components/formControls/SegmentedControl";
import type { SegmentedControlProps } from "components/formControls/SegmentedControl";
import FormTemplateControl from "components/formControls/FormTemplateControl";
import type { FormTemplateControlProps } from "components/formControls/FormTemplateControl";
import MultiFilePickerControl from "components/formControls/MultiFilePickerControl";
import type { MultipleFilePickerControlProps } from "components/formControls/MultiFilePickerControl";
import type { RadioButtonControlProps } from "components/formControls/RadioButtonControl";
import RadioButtonControl from "components/formControls/RadioButtonControl";
import {
  RagIntegrations,
  RagDocumentsSelector,
} from "ee/components/formControls/Rag";
import {
  SliderControl,
  type SliderControlProps,
} from "components/formControls/SliderControl";
import { HybridSearchControl } from "components/formControls/HybridSearch";
import FunctionCallingConfigControl from "components/formControls/FunctionCallingConfigControl";
import {
  DatasourceLinkControl,
  type DatasourceLinkControlProps,
} from "components/formControls/DatasourceLinkControl";
import { CustomActionsControl } from "components/formControls/CustomActionsConfigControl";

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
    FormControlFactory.registerControlBuilder(
      formControlTypes.SEGMENTED_CONTROL,
      {
        buildPropertyControl(controlProps: SegmentedControlProps): JSX.Element {
          return <SegmentedControl {...controlProps} />;
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
    FormControlFactory.registerControlBuilder(formControlTypes.FORM_TEMPLATE, {
      buildPropertyControl(
        controlProps: FormTemplateControlProps,
      ): JSX.Element {
        return <FormTemplateControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(
      formControlTypes.MULTIPLE_FILE_PICKER,
      {
        buildPropertyControl(
          controlProps: MultipleFilePickerControlProps,
        ): JSX.Element {
          return <MultiFilePickerControl {...controlProps} />;
        },
      },
    );
    FormControlFactory.registerControlBuilder(formControlTypes.RADIO_BUTTON, {
      buildPropertyControl(controlProps: RadioButtonControlProps): JSX.Element {
        return <RadioButtonControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(
      formControlTypes.RAG_INTEGRATIONS,
      {
        buildPropertyControl(controlProps): JSX.Element {
          return <RagIntegrations {...controlProps} />;
        },
      },
    );
    FormControlFactory.registerControlBuilder(formControlTypes.SLIDER, {
      buildPropertyControl(controlProps: SliderControlProps): JSX.Element {
        return <SliderControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(
      formControlTypes.RAG_DOCUMENTS_SELECTOR,
      {
        buildPropertyControl(controlProps): JSX.Element {
          return (
            <RagDocumentsSelector
              actionId={controlProps.actionId}
              datasourceId={controlProps.datasourceId}
              workspaceId={controlProps.workspaceId}
            />
          );
        },
      },
    );
    FormControlFactory.registerControlBuilder(formControlTypes.HYBRID_SEARCH, {
      buildPropertyControl(controlProps: SliderControlProps): JSX.Element {
        return <HybridSearchControl {...controlProps} />;
      },
    });
    FormControlFactory.registerControlBuilder(
      formControlTypes.FUNCTION_CALLING_CONFIG_FORM,
      {
        buildPropertyControl(controlProps): JSX.Element {
          return <FunctionCallingConfigControl {...controlProps} />;
        },
      },
    );
    FormControlFactory.registerControlBuilder(
      formControlTypes.DATASOURCE_LINK,
      {
        buildPropertyControl(
          controlProps: DatasourceLinkControlProps,
        ): JSX.Element {
          return <DatasourceLinkControl {...controlProps} />;
        },
      },
    );

    FormControlFactory.registerControlBuilder(
      formControlTypes.CUSTOM_ACTIONS_CONFIG_FORM,
      {
        buildPropertyControl(controlProps): JSX.Element {
          return <CustomActionsControl {...controlProps} />;
        },
      },
    );
  }
}

export default FormControlRegistry;
