import type { ValidationResponse } from "constants/WidgetValidation";
import { ValidationTypes } from "constants/WidgetValidation";
import React from "react";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import DocumentViewerComponent from "../component";

export function documentUrlValidation(value: unknown): ValidationResponse {
  // applied validations if value exist
  if (value) {
    const whiteSpaceRegex = /\s/g;
    const urlRegex =
      /(?:https:\/\/|www)?([\da-z.-]+)\.([a-z.]{2,6})[/\w .-]*\/?/;
    const base64Regex =
      /^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i;
    if (
      urlRegex.test(value as string) &&
      !whiteSpaceRegex.test(value as string)
    ) {
      if ((value as string).startsWith("www")) {
        return {
          isValid: true,
          parsed: "https://" + value,
        };
      }
      try {
        const newUrl = new URL(value as string);
        // URL is valid
        return {
          isValid: true,
          parsed: newUrl.href,
        };
      } catch (error) {
        return {
          isValid: false,
          parsed: "",
          messages: [
            {
              name: "ValidationError",
              message: "Provided URL / Base64 is invalid.",
            },
          ],
        };
      }
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
        messages: [
          {
            name: "ValidationError",
            message: "Provided URL / Base64 is invalid.",
          },
        ],
      };
    }
  }
  // value is empty here
  return {
    isValid: true,
    parsed: "",
    messages: [{ name: "", message: "" }],
  };
}

class DocumentViewerWidget extends BaseWidget<
  DocumentViewerWidgetProps,
  WidgetState
> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            helpText:
              "Preview document URL supports txt, pdf, docx, ppt, pptx, xlsx file formats, but base64 ppt/pptx are not supported.",
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
        ],
      },
      {
        sectionName: "General",
        children: [
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
          {
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
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
