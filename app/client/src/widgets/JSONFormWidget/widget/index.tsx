import React from "react";
import equal from "fast-deep-equal/es6";
import log from "loglevel";
import { connect } from "react-redux";
import { debounce, isEmpty } from "lodash";

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
import { ButtonStyleProps } from "widgets/ButtonWidget/component";
import { BoxShadow } from "components/designSystems/appsmith/WidgetStyleContainer";

export interface JSONFormWidgetProps extends WidgetProps {
  borderColor?: string;
  borderRadius?: number;
  boxShadow?: BoxShadow;
  boxShadowColor?: string;
  canvasWidgets: Record<string, WidgetProps>;
  disabledWhenInvalid?: boolean;
  fieldState: Record<string, any>;
  fixedFooter: boolean;
  isVisible: boolean;
  onSubmit?: string;
  resetButtonStyles: ButtonStyleProps;
  schema: Schema;
  scrollContents: boolean;
  showReset: boolean;
  sourceData?: Record<string, any>;
  submitButtonStyles: ButtonStyleProps;
  title: string;
}

export type FieldValidityState = FieldState<{ isValid: boolean }>;

export type JSONFormWidgetState = {
  fieldValidity: FieldValidityState;
};

const SAVE_FIELD_STATE_DEBOUNCE_TIMEOUT = 400;

class JSONFormWidget extends BaseWidget<
  JSONFormWidgetProps,
  WidgetState & JSONFormWidgetState
> {
  debouncedParseAndSaveFieldState: any;
  constructor(props: JSONFormWidgetProps) {
    super(props);
    this.debouncedParseAndSaveFieldState = debounce(
      this.parseAndSaveFieldState,
      SAVE_FIELD_STATE_DEBOUNCE_TIMEOUT,
    );
  }

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
    this.debouncedParseAndSaveFieldState();
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

    log.debug(
      "JSONForm widget schema parsing took",
      performance.now() - start,
      "ms",
    );

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
        backgroundColor={this.props.backgroundColor}
        borderColor={this.props.borderColor}
        borderRadius={this.props.borderRadius}
        borderWidth={this.props.borderWidth}
        boxShadow={this.props.boxShadow}
        boxShadowColor={this.props.boxShadowColor}
        disabledWhenInvalid={this.props.disabledWhenInvalid}
        executeAction={this.onExecuteAction}
        fixedFooter={this.props.fixedFooter}
        onSubmit={this.onSubmit}
        renderMode={this.props.renderMode}
        resetButtonStyles={this.props.resetButtonStyles}
        schema={this.props.schema}
        scrollContents={this.props.scrollContents}
        setFieldValidityState={this.setFieldValidityState}
        showReset={this.props.showReset}
        submitButtonStyles={this.props.submitButtonStyles}
        title={this.props.title}
        updateFormData={this.updateFormData}
        updateWidgetMetaProperty={this.onUpdateWidgetMetaProperty}
        updateWidgetProperty={this.onUpdateWidgetProperty}
        widgetId={this.props.widgetId}
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
