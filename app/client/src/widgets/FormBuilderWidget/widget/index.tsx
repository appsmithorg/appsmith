import React from "react";
import equal from "fast-deep-equal/es6";
import { connect } from "react-redux";
import { isEmpty } from "lodash";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import FormBuilderComponent from "../component";
import propertyConfig from "./propertyConfig";
import SchemaParser from "../schemaParser";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import {
  EventType,
  ExecuteTriggerPayload,
} from "constants/AppsmithActionConstants/ActionConstants";
import { Schema } from "../constants";
import { AppState } from "reducers";

export interface FormBuilderWidgetProps extends WidgetProps {
  canvasWidgets: Record<string, WidgetProps>;
  fixedFooter: boolean;
  sourceData?: Record<string, any>;
  isVisible: boolean;
  onSubmit?: string;
  schema: Schema;
  scrollContent: boolean;
  scrollContents: boolean;
  showReset: boolean;
  title: string;
}

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

  static defaultProps = {};

  componentDidMount() {
    this.constructAndSaveSchemaIfRequired();
  }

  componentDidUpdate(prevProps: FormBuilderWidgetProps) {
    this.constructAndSaveSchemaIfRequired(prevProps);
  }

  constructAndSaveSchemaIfRequired = (prevProps?: FormBuilderWidgetProps) => {
    const prevSourceData = prevProps?.sourceData;
    const currSourceData = this.props?.sourceData;
    const widget = this.props.canvasWidgets[this.props.widgetId];

    if (isEmpty(currSourceData)) {
      return;
    }

    // Hot path - early exit
    if (equal(prevSourceData, currSourceData)) {
      return;
    }

    const start = performance.now();
    const schema = SchemaParser.parse(
      widget.widgetName,
      currSourceData,
      widget.schema,
    );
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

  onExecuteAction = (actionPayload: ExecuteTriggerPayload) => {
    super.executeAction(actionPayload);
  };

  onUpdateWidgetProperty = (propertyName: string, propertyValue: any) => {
    this.updateWidgetProperty(propertyName, propertyValue);
  };

  getPageView() {
    return (
      <FormBuilderComponent
        {...this.props}
        executeAction={this.onExecuteAction}
        onSubmit={this.onSubmit}
        updateFormValues={this.updateFormValues}
        updateWidgetProperty={this.onUpdateWidgetProperty}
      />
    );
  }

  static getWidgetType(): string {
    return "FORM_BUILDER_WIDGET";
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    canvasWidgets: state.entities.canvasWidgets,
  };
};

export default connect(mapStateToProps, null)(FormBuilderWidget);
