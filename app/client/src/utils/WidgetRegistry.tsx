import BaseWidget from "../widgets/BaseWidget"
import ContainerWidget, {
  IContainerWidgetProps
} from "../widgets/ContainerWidget"
import { IContainerProps } from "../editorComponents/ContainerComponent"
import WidgetFactory from "./WidgetFactory"

class WidgetBuilderRegistry {
  static registerWidgetBuilders() {
    WidgetFactory.registerWidgetBuilder("CONTAINER_WIDGET", {
      buildWidget(
        widgetData: IContainerWidgetProps
      ): BaseWidget<IContainerWidgetProps, IContainerProps> {
        return new ContainerWidget(widgetData)
      }
    })
  }
}

export default WidgetBuilderRegistry
