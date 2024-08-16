import type { ValidationResponse } from "constants/WidgetValidation";
import { ValidationTypes } from "constants/WidgetValidation";
import React from "react";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import DocumentViewerComponent from "../component";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import type { SetterConfig } from "entities/AppTheming";
import {
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";

import { isAirgapped } from "ee/utils/airgapHelpers";
import { WIDGET_TAGS } from "constants/WidgetConstants";

const isAirgappedInstance = isAirgapped();

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
  static type = "DOCUMENT_VIEWER_WIDGET";

  static getConfig() {
    return {
      name: "Document Viewer", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.MEDIA],
      needsMeta: false, // Defines if this widget adds any meta properties
      isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
      searchTags: ["pdf"],
    };
  }

  static getDefaults() {
    return {
      widgetName: "DocumentViewer",
      docUrl: !isAirgappedInstance
        ? "https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf"
        : "",
      rows: 40,
      columns: 24,
      version: 1,
      animateLoading: true,
      responsiveBehavior: ResponsiveBehavior.Fill,
      flexVerticalAlignment: FlexVerticalAlignment.Top,
    };
  }

  static getAutoLayoutConfig() {
    return {
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "280px",
              minHeight: "280px",
            };
          },
        },
      ],
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "280px" },
        minWidth: { base: "280px" },
      },
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            helpText:
              "Preview document URL supports txt, pdf, docx, ppt, pptx, xlsx file formats, but base64 ppt/pptx are not supported.",
            propertyName: "docUrl",
            label: "Document link",
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
            label: "Animate loading",
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

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
        setURL: {
          path: "docUrl",
          type: "string",
        },
      },
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc": "Document viewer widget is used to show documents on a page",
      "!url": "https://docs.appsmith.com/reference/widgets/document-viewer",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      docUrl: "string",
    };
  }

  getWidgetView() {
    return <DocumentViewerComponent docUrl={this.props.docUrl} />;
  }
}

export interface DocumentViewerWidgetProps extends WidgetProps {
  docUrl: string;
}

export default DocumentViewerWidget;
