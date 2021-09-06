import React from "react";
import * as Sentry from "@sentry/react";

import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import withMeta, { WithMeta } from "./MetaHOC";
import ImageAnnotatorComponent from "components/designSystems/appsmith/ImageAnnotatorComponent";

export interface ImageAnnotatorWidgetProps extends WidgetProps, WithMeta {
  imageUrl: string;
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
    ];
  }

  getPageView() {
    const { imageUrl, widgetId } = this.props;

    return <ImageAnnotatorComponent imageUrl={imageUrl} widgetId={widgetId} />;
  }

  getWidgetType(): WidgetType {
    return "IMAGE_ANNOTATOR_WIDGET";
  }
}

export default ImageAnnotatorWidget;
export const ProfiledImageAnnotatorWidget = Sentry.withProfiler(
  ImageAnnotatorWidget,
);
