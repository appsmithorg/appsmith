import React from "react";
import equal from "fast-deep-equal/es6";
import { connect } from "react-redux";
import { debounce, difference } from "lodash";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import JSONFormComponent from "../component";
import propertyConfig from "./propertyConfig";
import { AppState } from "reducers";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import {
  EventType,
  ExecuteTriggerPayload,
} from "constants/AppsmithActionConstants/ActionConstants";
import { FieldState, Schema } from "../constants";
import {
  ComputedSchemaStatus,
  computeSchema,
  dynamicPropertyPathListFromSchema,
  generateFieldState,
} from "./helper";
import { ButtonStyleProps } from "widgets/ButtonWidget/component";
import { BoxShadow } from "components/designSystems/appsmith/WidgetStyleContainer";

export interface JSONFormWidgetProps extends WidgetProps {
  autoGenerateForm?: boolean;
  borderColor?: string;
  borderRadius?: number;
  boxShadow?: BoxShadow;
  fieldLimitExceeded: boolean;
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

export type MetaInternalFieldState = FieldState<{
  isValid: boolean;
  filterText?: string;
}>;

export type JSONFormWidgetState = {
  isSubmitting: boolean;
  metaInternalFieldState: MetaInternalFieldState;
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

  state = {
    isSubmitting: false,
    metaInternalFieldState: {},
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

  computeDynamicPropertyPathList = (schema: Schema) => {
    const pathListFromSchema = dynamicPropertyPathListFromSchema(schema);
    const pathListFromProps = (this.props.dynamicPropertyPathList || []).map(
      ({ key }) => key,
    );

    const newPaths = difference(pathListFromSchema, pathListFromProps);

    return [...pathListFromProps, ...newPaths].map((path) => ({ key: path }));
  };

  /**
   * Why this computation cannot be done in the updateHook of the sourceData property
   *
   * For the case where a binding is used for the sourceData eg {{Table1.selectedRow}},
   * we would have to look at the __evaluation__ object to find the evaluated value of this
   * property but as the updateHook runs before the evaluations evaluate the {{Table1.selectedRow}}
   * we would get stale/previous data from the __evaluations__ object.
   * So it will always stay 1 step behind the actual value.
   */
  constructAndSaveSchemaIfRequired = (prevProps?: JSONFormWidgetProps) => {
    if (!this.props.autoGenerateForm) return;

    const widget = this.props.canvasWidgets[
      this.props.widgetId
    ] as JSONFormWidgetProps;
    const prevSourceData = prevProps?.sourceData;
    const currSourceData = this.props?.sourceData;

    const { dynamicPropertyPathList, schema, status } = computeSchema({
      currentDynamicPropertyPathList: this.props.dynamicPropertyPathList,
      currSourceData,
      prevSchema: widget.schema,
      prevSourceData,
      widgetName: widget.widgetName,
    });

    if (status === ComputedSchemaStatus.UNCHANGED) return;

    if (
      status === ComputedSchemaStatus.LIMIT_EXCEEDED &&
      !this.props.fieldLimitExceeded
    ) {
      this.updateWidgetProperty("fieldLimitExceeded", true);
      return;
    }

    if (status === ComputedSchemaStatus.UPDATED) {
      this.batchUpdateWidgetProperty({
        modify: { schema, dynamicPropertyPathList, fieldLimitExceeded: false },
      });
    }
  };

  updateFormData = (values: any) => {
    this.props.updateWidgetMetaProperty("formData", values);
  };

  parseAndSaveFieldState = () => {
    const fieldState = generateFieldState(
      this.props.schema,
      this.state.metaInternalFieldState,
    );

    if (!equal(fieldState, this.props.fieldState)) {
      this.props.updateWidgetMetaProperty("fieldState", fieldState);
    }
  };

  onSubmit = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.stopPropagation();
    event.preventDefault();

    if (this.props.onSubmit) {
      this.setState({
        isSubmitting: true,
      });

      super.executeAction({
        triggerPropertyName: "onSubmit",
        dynamicString: this.props.onSubmit,
        event: {
          type: EventType.ON_SUBMIT,
          callback: this.handleSubmitResult,
        },
      });
    }
  };

  handleSubmitResult = () => {
    this.setState({
      isSubmitting: false,
    });
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

  setMetaInternalFieldState = (
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
        fieldLimitExceeded={this.props.fieldLimitExceeded}
        fixedFooter={this.props.fixedFooter}
        isSubmitting={this.state.isSubmitting}
        onSubmit={this.onSubmit}
        renderMode={this.props.renderMode}
        resetButtonStyles={this.props.resetButtonStyles}
        schema={this.props.schema}
        scrollContents={this.props.scrollContents}
        setMetaInternalFieldState={this.setMetaInternalFieldState}
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
