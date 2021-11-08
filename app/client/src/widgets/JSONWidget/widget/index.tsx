import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import JSONComponent from "../component";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import log from "loglevel";
class JSONWidget extends BaseWidget<JSONWidgetProps, WidgetState> {
  constructor(props: any) {
    super(props);
    this.setUpdatedData = this.setUpdatedData.bind(this);
  }
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText:
              "Takes in an array of objects to display items in the list.",
            propertyName: "data",
            label: "Data",
            controlType: "INPUT_TEXT",
            placeholderText: '[{ "name": "John" }]',
            isBindProperty: true,
            isTriggerProperty: false,
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
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
    return {
      updated_data: "",
      old_input_data: "",
    };
  }
  setUpdatedData(newData: any) {
    this.props.updateWidgetMetaProperty("updated_data", newData);
    return true;
  }
  getInJSONFormat(y: any) {
    let x: any;
    if (typeof y == "string") {
      if (y == "") {
        x = { name: "John" };
      } else {
        x = JSON.parse(y);
      }
    } else {
      x = y ? y : {};
    }
    return x;
  }
  getPageView() {
    try {
      if (this.props.old_input_data != this.props.data) {
        this.props.updateWidgetMetaProperty("old_input_data", this.props.data);
        const x = this.getInJSONFormat(this.props.data);
        this.setUpdatedData(x);
      }

      return (
        <JSONComponent
          data={this.getInJSONFormat(this.props.updated_data)}
          setUpdatedData={this.setUpdatedData}
          widgetName={this.props.widgetName}
        />
      );
    } catch (err) {
      log.debug("JSON", err);
    }
  }

  static getWidgetType(): string {
    return "JSON_WIDGET";
  }
}

export interface JSONWidgetProps extends WidgetProps {
  data?: string;
}

export default JSONWidget;
