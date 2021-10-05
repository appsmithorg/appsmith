import React from "react";
import equal from "fast-deep-equal/es6";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import FormBuilderComponent from "../component";
import Parser from "../parser";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { ValidationTypes } from "constants/WidgetValidation";
import { Schema } from "../constants";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

export type FormBuilderWidgetProps = WidgetProps & {
  addFormBuilderWidgets: (widgetId: string, children: WidgetProps[]) => void;
  children?: WidgetProps[];
  isLatestSchemaRendered: boolean;
  schema: Schema;
  primaryFields: string[];
  formData?: Record<string, any>;
};

const formDataValidationFn = (
  value: any,
  props: FormBuilderWidgetProps,
  _?: any,
) => {
  debugger;
  if (_.isObject(value)) {
    return {
      isValid: true,
      parsed: value,
    };
  }

  try {
    return {
      isValid: true,
      parsed: JSON.parse(value as string),
    };
  } catch {
    return {
      isValid: true,
      parsed: {},
    };
  }
};
class FormBuilderWidget extends BaseWidget<
  FormBuilderWidgetProps,
  WidgetState
> {
  state = {
    isSchemaRendered: false,
  };

  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "formData",
            helpText: "Input JSON sample for default form layout",
            label: "Form Data",
            controlType: "INPUT_TEXT",
            placeholderText: 'Enter { "firstName": "John" }',
            isBindProperty: true,
            isTriggerProperty: false,
            // TODO: Add JSON validation type?
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: formDataValidationFn,
                expected: {
                  type: "JSON",
                  example: `{ "name": "John Doe", age: 29 }`,
                  // TODO: CHECK WHAT AutocompleteDataType is
                  autocompleteDataType: AutocompleteDataType.OBJECT,
                },
              },
            },
          },
          {
            propertyName: "backgroundColor",
            label: "Background Color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "fixedFooter",
            helpText: "Makes the footer always stick to the bottom of the form",
            label: "Fixed Footer",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isVisible",
            helpText: "Controls the visibility of the widget",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "scrollContents",
            helpText: "Allows scrolling of the form",
            label: "Scroll Contents",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
    ];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  componentDidMount() {
    this.constructAndSaveSchemaIfRequired();
  }

  componentDidUpdate(prevProps: FormBuilderWidgetProps) {
    this.constructAndSaveSchemaIfRequired(prevProps);
  }

  constructAndSaveSchemaIfRequired = (prevProps?: FormBuilderWidgetProps) => {
    const prevFormData = prevProps?.formData;
    const currFormData = this.props?.formData;

    // Hot path - early exit
    if (equal(prevFormData, currFormData)) {
      return;
    }

    const currSchema = (() => {
      if (this.props.schema?.__root__) {
        return this.props.schema.__root__.children;
      }

      return;
    })();

    const rootSchemaObject = Parser.getSchemaObjectFor("", currFormData, {
      currFormData,
      prevFormData,
      currSchema,
    });

    // eslint-disable-next-line
    console.log("FORM BUILDER", this.props);
    const schema = {
      __root__: rootSchemaObject,
    };

    // eslint-disable-next-line
    console.log("FORM BUILDER - SCHEMA", schema);
    this.props.updateWidgetMetaProperty("schema", schema);
  };

  getPageView() {
    return (
      <FormBuilderComponent
        backgroundColor={this.props.backgroundColor}
        inputData={this.props?.formData}
        schema={this.props.schema}
      />
    );
  }

  static getWidgetType(): string {
    return "FORM_BUILDER_WIDGET";
  }
}

export default FormBuilderWidget;
