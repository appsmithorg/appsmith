import * as React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import ImageComponent from "components/designSystems/appsmith/ImageComponent";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";

class ImageWidget extends BaseWidget<ImageWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      image: VALIDATION_TYPES.TEXT,
      imageShape: VALIDATION_TYPES.TEXT,
      defaultImage: VALIDATION_TYPES.TEXT,
    };
  }
  getPageView() {
    return (
      <ImageComponent
        widgetId={this.props.widgetId}
        imageUrl={this.props.image}
        defaultImageUrl={this.props.defaultImage}
        isLoading={this.props.isLoading}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "IMAGE_WIDGET";
  }
}

export type ImageShape = "RECTANGLE" | "CIRCLE" | "ROUNDED";

export interface ImageWidgetProps extends WidgetProps {
  image: string;
  imageShape: ImageShape;
  defaultImage: string;
}

export default ImageWidget;
