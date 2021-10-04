import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import DocumentViewerComponent from "../component";
import { ValidationTypes } from "constants/WidgetValidation";

class DocumentViewerWidget extends BaseWidget<
  DocumentViewerWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Document url for preview",
            propertyName: "docUrl",
            label: "Document Link",
            controlType: "INPUT_TEXT",
            placeholderText: "URL / Base64",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Controls visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
    ];
  }

  getPageView() {
    return <DocumentViewerComponent docUrl={this.props.docUrl} />;
  }

  static getWidgetType(): string {
    return "DOCUMENT_VIEWER_WIDGET";
  }
}

export interface DocumentViewerWidgetProps extends WidgetProps {
  docUrl: string;
}

export default DocumentViewerWidget;
