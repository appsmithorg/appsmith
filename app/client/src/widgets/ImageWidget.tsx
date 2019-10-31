import * as React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import ImageComponent from "../components/appsmith/ImageComponent";

class ImageWidget extends BaseWidget<ImageWidgetProps, WidgetState> {
  getPageView() {
    return (
      <ImageComponent
        widgetId={this.props.widgetId}
        style={this.getPositionStyle()}
        imageUrl={this.props.image}
        defaultImageUrl={this.props.defaultImage}
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
