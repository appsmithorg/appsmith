import * as React from "react"
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget"
import { WidgetType } from "../constants/WidgetConstants"

class ImageWidget extends BaseWidget<ImageWidgetProps, IWidgetState> {

  getPageView() {
    return (
      <div/>
    )
  }

  getWidgetType(): WidgetType {
    return "IMAGE_WIDGET"
  }
}

export type ImageShape = "RECTANGLE" | "CIRCLE" | "ROUNDED"

export interface ImageWidgetProps extends IWidgetProps {
  image: string
  imageShape: ImageShape
  defaultImage: string
}

export default ImageWidget
