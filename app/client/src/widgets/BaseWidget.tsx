/***
 * Widget are responsible for accepting the abstraction layer inputs, interpretting them into rederable props and
 * spawing components based on those props
 * Widgets are also responsible for dispatching actions and updating the state tree
 */
import { WidgetType } from "../constants/WidgetConstants"
import { Component } from "react"

abstract class BaseWidget<
  T extends IWidgetProps,
  K extends IWidgetState
> extends Component<T, K> {
  componentDidMount(): void {
    this.calculateWidgetBounds(
      this.props.rightColumn,
      this.props.leftColumn,
      this.props.topRow,
      this.props.bottomRow,
      this.props.parentColumnSpace,
      this.props.parentRowSpace
    )
  }

  componentWillReceiveProps(prevProps: T, nextProps: T) {
    this.calculateWidgetBounds(
      nextProps.rightColumn,
      nextProps.leftColumn,
      nextProps.topRow,
      nextProps.bottomRow,
      nextProps.parentColumnSpace,
      nextProps.parentRowSpace
    )
  }

  calculateWidgetBounds(
    rightColumn: number,
    leftColumn: number,
    topRow: number,
    bottomRow: number,
    parentColumnSpace: number,
    parentRowSpace: number
  ) {
    const widgetState: IWidgetState = {
      width: (rightColumn - leftColumn) * parentColumnSpace,
      height: (bottomRow - topRow) * parentRowSpace
    }
    this.setState(widgetState)
  }

  render() {
    return this.getWidgetView()
  }

  abstract getWidgetView(): JSX.Element

  abstract getWidgetType(): WidgetType
}

export interface IWidgetState {
  height: number
  width: number
}

export interface IWidgetBuilder<T extends IWidgetProps> {
  buildWidget(data: T): JSX.Element
}

export interface IWidgetProps {
  widgetType: WidgetType
  key?: string
  widgetId: string
  topRow: number
  leftColumn: number
  bottomRow: number
  rightColumn: number
  parentColumnSpace: number
  parentRowSpace: number
}

export default BaseWidget
