import React from "react";
import equal from "fast-deep-equal/es6";
import { connect } from "react-redux";
import { isEmpty, merge } from "lodash";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import JSONFormComponent from "../component";
import propertyConfig from "./propertyConfig";
import SchemaParser from "../schemaParser";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import {
  EventType,
  ExecuteTriggerPayload,
} from "constants/AppsmithActionConstants/ActionConstants";
import { ARRAY_ITEM_KEY, DataType, Schema, SchemaItem } from "../constants";
import { AppState } from "reducers";

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

class JSONFormWidget extends BaseWidget<JSONFormWidgetProps, WidgetState> {
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

  updateFormValues = (values: any) => {
    this.props.updateWidgetMetaProperty("data", values);
  };

  parseAndSaveFieldState = () => {
    const processObject = (schema: Schema) => {
      const obj: Record<string, any> = {};

      Object.values(schema).forEach((schemaItem) => {
        obj[schemaItem.name] = processSchemaItem(schemaItem);
      });

      return obj;
    };

    const processArray = (schema: Schema): any[] => {
      if (schema[ARRAY_ITEM_KEY]) {
        return [processSchemaItem(schema[ARRAY_ITEM_KEY])];
      }

      return [];
    };

    const processSchemaItem = (schemaItem: SchemaItem) => {
      if (schemaItem.dataType === DataType.OBJECT) {
        return processObject(schemaItem.children);
      }

      if (schemaItem.dataType === DataType.ARRAY) {
        return processArray(schemaItem.children);
      }

      const { isDisabled, isRequired, isVisible } = schemaItem;
      return { isDisabled, isVisible, isRequired };
    };

    let fieldState = {};

    if (this.props.schema) {
      Object.values(this.props.schema).forEach((schemaItem) => {
        fieldState = processSchemaItem(schemaItem);
      });
    }

    /**
     * Reason for merging fieldState into this.props.fieldState:
     * fieldState value is derived from schemaItem which gives us "isDisabled", "isVisible" etc
     * but it does not give us isValid which is directly updated into the meta property "fieldState"
     * by individual fields, hence we merge to keep the extra properties intact.
     * */
    const mergedFieldState = merge(this.props.fieldState, fieldState);

    if (!equal(mergedFieldState, this.props.fieldState)) {
      this.props.updateWidgetMetaProperty("fieldState", mergedFieldState);
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

  getPageView() {
    return (
      <JSONFormComponent
        {...this.props}
        executeAction={this.onExecuteAction}
        onSubmit={this.onSubmit}
        updateFormValues={this.updateFormValues}
        updateWidgetMetaProperty={this.onUpdateWidgetMetaProperty}
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

export default connect(mapStateToProps, null)(JSONFormWidget);
