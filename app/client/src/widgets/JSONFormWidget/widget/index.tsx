import React from "react";
import equal from "fast-deep-equal/es6";
import { connect } from "react-redux";
import { isEmpty } from "lodash";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import JSONFormComponent from "../component";
import propertyConfig from "./propertyConfig";
import SchemaParser from "../schemaParser";
import { AppState } from "reducers";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import {
  EventType,
  ExecuteTriggerPayload,
} from "constants/AppsmithActionConstants/ActionConstants";
import { FieldState, Schema } from "../constants";
import { generateFieldState } from "./helper";

export interface JSONFormWidgetProps extends WidgetProps {
  canvasWidgets: Record<string, WidgetProps>;
  disabledWhenInvalid?: boolean;
  fieldState: Record<string, any>;
  fixedFooter: boolean;
  isVisible: boolean;
  onSubmit?: string;
  schema: Schema;
  scrollContent: boolean;
  scrollContents: boolean;
  showReset: boolean;
  sourceData?: Record<string, any>;
  title: string;
}

export type FieldValidityState = FieldState<{ isValid: boolean }>;

export type JSONFormWidgetState = {
  fieldValidity: FieldValidityState;
};

class JSONFormWidget extends BaseWidget<
  JSONFormWidgetProps,
  WidgetState & JSONFormWidgetState
> {
  state: JSONFormWidgetState = {
    fieldValidity: {},
  };

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
      formData: {},
      fieldState: {},
    };
  }

  static defaultProps = {};

  componentDidMount() {
    this.constructAndSaveSchemaIfRequired();
  }

  componentDidUpdate(prevProps: JSONFormWidgetProps) {
    this.constructAndSaveSchemaIfRequired(prevProps);
    this.parseAndSaveFieldState();
  }

  constructAndSaveSchemaIfRequired = (prevProps?: JSONFormWidgetProps) => {
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

  updateFormData = (values: any) => {
    this.props.updateWidgetMetaProperty("formData", values);
  };

  parseAndSaveFieldState = () => {
    const fieldState = generateFieldState(
      this.props.schema,
      this.state.fieldValidity,
    );

    if (!equal(fieldState, this.props.fieldState)) {
      this.props.updateWidgetMetaProperty("fieldState", fieldState);
    }
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

  onUpdateWidgetMetaProperty = (propertyName: string, propertyValue: any) => {
    this.props.updateWidgetMetaProperty(propertyName, propertyValue);
  };

  setFieldValidityState = (
    cb: (prevState: JSONFormWidgetState) => JSONFormWidgetState,
  ) => {
    this.setState(cb);
  };

  getPageView() {
    return (
      <JSONFormComponent
        {...this.props}
        executeAction={this.onExecuteAction}
        onSubmit={this.onSubmit}
        setFieldValidityState={this.setFieldValidityState}
        updateFormData={this.updateFormData}
        updateWidgetMetaProperty={this.onUpdateWidgetMetaProperty}
        updateWidgetProperty={this.onUpdateWidgetProperty}
      />
    );
  }

  static getWidgetType(): string {
    return "JSON_FORM_WIDGET";
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    canvasWidgets: state.entities.canvasWidgets,
  };
};

export default connect(mapStateToProps, null)(JSONFormWidget);
