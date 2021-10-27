import React from "react";
import equal from "fast-deep-equal/es6";
import { isEmpty } from "lodash";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import FormBuilderComponent from "../component";
import propertyConfig from "./propertyConfig";
import SchemaParser from "../schemaParser";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { Schema } from "../constants";

export type FormBuilderWidgetProps = WidgetProps & {
  fixedFooter: boolean;
  formData?: Record<string, any>;
  isVisible: boolean;
  onSubmit?: string;
  schema: Schema;
  scrollContent: boolean;
  scrollContents: boolean;
  showReset: boolean;
  title: string;
  useFormDataValues: boolean;
};

class FormBuilderWidget extends BaseWidget<
  FormBuilderWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return propertyConfig;
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      data: {},
    };
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

    if (isEmpty(currFormData)) {
      return;
    }

    // Hot path - early exit
    if (equal(prevFormData, currFormData)) {
      return;
    }

    const start = performance.now();
    const schema = SchemaParser.parse(currFormData, this.props.schema);
    const end = performance.now();

    // eslint-disable-next-line
    console.log("FORM BUILDER _ PERF", `${end - start} ms`);

    // eslint-disable-next-line
    console.log("FORM BUILDER - SCHEMA", schema);
    this.updateWidgetProperty("schema", schema);
  };

  updateFormValues = (values: any) => {
    this.props.updateWidgetMetaProperty("data", values);
  };

  updateFormFieldValue = (name: string, value: any) => {
    this.props.updateWidgetMetaProperty(`data.${name}`, value);
  };

  onSubmit = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.stopPropagation();
    event.preventDefault();

    if (this.props.onSubmit) {
      super.executeAction({
        triggerPropertyName: "onSubmit",
        dynamicString: this.props.onSubmit,
        event: {
          type: EventType.ON_SUBMIT,
        },
      });
    }
  };

  getPageView() {
    return (
      <FormBuilderComponent
        {...this.props}
        onSubmit={this.onSubmit}
        updateFormValues={this.updateFormValues}
      />
    );
  }

  static getWidgetType(): string {
    return "FORM_BUILDER_WIDGET";
  }
}

export default FormBuilderWidget;
