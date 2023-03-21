import * as React from "react";

import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import type { KeyValueComponentProps } from "../component";
import { KeyValueComponent } from "../component";

export type KeyValueWidgetProps = WidgetProps & KeyValueComponentProps;

class KeyValueWidget extends BaseWidget<KeyValueWidgetProps, WidgetState> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            helpText:
              "Displays a list of options for a user to select. Values must be unique",
            propertyName: "data",
            label: "Key Value Data",
            controlType: "INPUT_TEXT",
            placeholderText: '[{ "key": "Option1", "value": "Option2" }]',
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
    ];
  }

  getPageView() {
    return <KeyValueComponent data={this.props.data} />;
  }

  static getWidgetType() {
    return "KEY_VALUE_WIDGET";
  }
}

export default KeyValueWidget;
