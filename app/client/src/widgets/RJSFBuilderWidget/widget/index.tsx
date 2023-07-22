import React from "react";

import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";

import RJSFBuilderComponent from "../component";

class RJSFBuilderWidget extends BaseWidget<
  RJSFBuilderWidgetProps,
  WidgetState
> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Show schema",
            propertyName: "schema",
            label: "Schema",
            controlType: "INPUT_TEXT",
            placeholderText: "should be a json",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            helpText: "Show schema",
            propertyName: "uischema",
            label: "UI Schema",
            controlType: "INPUT_TEXT",
            placeholderText: "should be a json",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "when the schema is changed",
            propertyName: "onSchemaChanged",
            label: "onChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [];
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      schema: "{}",
    };
  }

  valueChangedHandler = (schema: string, uischema: string) => {
    this.props.updateWidgetMetaProperty("schema", schema);

    this.props.updateWidgetMetaProperty("uischema", uischema);
  };

  getPageView() {
    const { schema, uischema } = this.props;

    return (
      <RJSFBuilderComponent
        onChange={this.valueChangedHandler}
        schema={schema}
        uischema={uischema}
        widgetId={this.props.widgetId}
      />
    );
  }

  static getWidgetType(): string {
    return "RJSFBUILDER_WIDGET";
  }

  static getStylesheetConfig() {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    };
  }
}

export interface RJSFBuilderWidgetProps extends WidgetProps {
  schema: any;
  uischema: any;
  onSchemaChanged: { schema: string; uischema: string };
}

export default RJSFBuilderWidget;
