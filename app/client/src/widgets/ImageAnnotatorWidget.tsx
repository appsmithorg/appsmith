import React from "react";
import * as Sentry from "@sentry/react";

import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import withMeta, { WithMeta } from "./MetaHOC";
import ImageAnnotatorComponent from "components/designSystems/appsmith/ImageAnnotatorComponent";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

export interface ImageAnnotatorWidgetProps extends WidgetProps, WithMeta {
  imageUrl: string;
  onAnnotationSaved?: string;
}

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
    const { imageUrl, widgetId } = this.props;

    return (
      <ImageAnnotatorComponent
        imageUrl={imageUrl}
        onSave={this.handleAnnotationSave}
        widgetId={widgetId}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "IMAGE_ANNOTATOR_WIDGET";
  }
}

export default ImageAnnotatorWidget;
export const ProfiledImageAnnotatorWidget = Sentry.withProfiler(
  withMeta(ImageAnnotatorWidget),
);
