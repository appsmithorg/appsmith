import { WidgetType } from "../constants/WidgetConstants"
import { IComponentProps } from "../editorComponents/BaseComponent"
/***
 * Widget are responsible for accepting the abstraction layer inputs, interpretting them into rederable props and
 * spawing components based on those props
 * Widgets are also responsible for dispatching actions and updating the state tree
 */
abstract class BaseWidget<T extends IWidgetProps, K extends IComponentProps> {
  widgetData: T
  width: number
  height: number

  constructor(widgetProps: T) {
    this.widgetData = widgetProps
    this.width =
      (this.widgetData.rightColumn - this.widgetData.leftColumn) *
      widgetProps.parentColumnSpace
    this.height =
      (this.widgetData.bottomRow - this.widgetData.topRow) *
      widgetProps.parentRowSpace
  }

  abstract getWidgetView(): React.Component<K>

  abstract getComponentProps(): K

  abstract getWidgetType(): WidgetType

}

export interface IWidgetBuilder<
  T extends IWidgetProps,
  K extends IComponentProps
> {
  buildWidget(data: T): BaseWidget<T, K>
}

export interface IWidgetProps {
  widgetType: WidgetType
  widgetId: string
  topRow: number
  leftColumn: number
  bottomRow: number
  rightColumn: number
  parentColumnSpace: number
  parentRowSpace: number
}

export default BaseWidget
