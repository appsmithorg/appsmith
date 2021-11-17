import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import DocumentViewerComponent from "../component";
import {
  ValidationTypes,
  ValidationResponse,
} from "constants/WidgetValidation";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

export function documentUrlValidation(value: unknown): ValidationResponse {
  // applied validations if value exist
  if (value) {
    const urlRegex = /(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})[/\w .-]*\/?/;
    const base64Regex = /^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i;
    if (urlRegex.test(value as string)) {
      // URL is valid
      return {
        isValid: true,
        parsed: value,
      };
    } else if (base64Regex.test(value as string)) {
      // base 64 is valid
      return {
        isValid: true,
        parsed: value,
      };
    } else {
      // value is not valid URL / Base64
      return {
        isValid: false,
        parsed: "",
        messages: ["Provided URL / Base64 is invalid."],
      };
    }
  }
  // value is empty here
  return {
    isValid: true,
    parsed: "",
    messages: [""],
  };
}

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
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: documentUrlValidation,
                expected: {
                  type: "URL / Base64",
                  example: "https://www.example.com",
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
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
