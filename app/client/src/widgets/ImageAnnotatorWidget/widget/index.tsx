import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import ImageAnnotatorComponent from "../component";
import { ValidationTypes } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

class ImageAnnotatorWidget extends BaseWidget<
  ImageAnnotatorWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Url of the image to be annotated",
            propertyName: "imageUrl",
            label: "Image URL",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter URL / Base64",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.IMAGE_URL },
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when annotations are saved",
            propertyName: "onAnnotationSaved",
            label: "onAnnotationSaved",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      value: undefined,
    };
  }

  handleAnnotationSave = (value: any) => {
    this.props.updateWidgetMetaProperty("value", value, {
      triggerPropertyName: "onAnnotationSaved",
      dynamicString: this.props.onAnnotationSaved,
      event: {
        type: EventType.ON_IMAGE_ANNOTATION_SAVED,
      },
    });
  };

  getPageView() {
    const { imageUrl } = this.props;
    return (
      <ImageAnnotatorComponent
        imageUrl={imageUrl}
        onSave={this.handleAnnotationSave}
      />
    );
  }

  static getWidgetType(): string {
    return "IMAGE_ANNOTATOR_WIDGET";
  }
}

export interface ImageAnnotatorWidgetProps extends WidgetProps {
  imageUrl: string;
  onAnnotationSaved?: string;
}

export default ImageAnnotatorWidget;
