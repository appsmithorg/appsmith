import * as React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";

class ImageWidget extends BaseWidget<ImageWidgetProps, WidgetState> {
  getPageView() {
    return <div />;
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
