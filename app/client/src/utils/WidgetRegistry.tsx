import BaseWidget, { IWidgetProps } from "../widgets/BaseWidget"
import ContainerWidget, {
  IContainerWidgetProps
} from "../widgets/ContainerWidget"
import TextWidget, {
  ITextWidgetProps
} from "../widgets/TextWidget"
import WidgetFactory from "./WidgetFactory"
import React from "react"

class WidgetBuilderRegistry {
  static registerWidgetBuilders() {
    
    WidgetFactory.registerWidgetBuilder("CONTAINER_WIDGET", {
      buildWidget(
        widgetData: IContainerWidgetProps<IWidgetProps>
      ): JSX.Element {
        return <ContainerWidget {...widgetData }/>
      }
    })

    WidgetFactory.registerWidgetBuilder("TEXT_WIDGET", {
      buildWidget(
        widgetData: ITextWidgetProps
      ): JSX.Element {
        return <TextWidget {...widgetData} />
      }
    })
  
  }
}

export default WidgetBuilderRegistry
