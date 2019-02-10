import BaseWidget from "../widgets/BaseWidget"
import ContainerWidget, {
  IContainerWidgetProps
} from "../widgets/ContainerWidget"
import TextWidget, {
  ITextWidgetProps
} from "../widgets/TextWidget"
import { IContainerProps } from "../editorComponents/ContainerComponent"
import WidgetFactory from "./WidgetFactory"
import { ITextComponentProps } from "../editorComponents/TextComponent";

class WidgetBuilderRegistry {
  static registerWidgetBuilders() {
    
    WidgetFactory.registerWidgetBuilder("CONTAINER_WIDGET", {
      buildWidget(
        widgetData: IContainerWidgetProps
      ): BaseWidget<IContainerWidgetProps, IContainerProps> {
        return new ContainerWidget(widgetData)
      }
    })

    WidgetFactory.registerWidgetBuilder("TEXT_WIDGET", {
      buildWidget(
        widgetData: ITextWidgetProps
      ): BaseWidget<ITextWidgetProps, ITextComponentProps> {
        return new TextWidget(widgetData)
      }
    })
  
  }
}

export default WidgetBuilderRegistry
