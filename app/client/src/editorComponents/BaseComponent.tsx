import { Component } from "react"
import { PositionType, CSSUnit } from "../constants/WidgetConstants"
import { Color } from "../constants/DefaultTheme";

/***
 * Components are responsible for binding render inputs to corresponding UI SDKs
 */
abstract class BaseComponent<T extends ComponentProps> extends Component<T> {}

export interface BaseStyle {
    height?: number;
    width?: number;
    positionType: PositionType;
    xPosition: number;
    yPosition: number;
    xPositionUnit: CSSUnit;
    yPositionUnit: CSSUnit;
    heightUnit?: CSSUnit;
    widthUnit?: CSSUnit;
    backgroundColor?: Color;

}

export interface ComponentProps {
    widgetId: string;
    style: BaseStyle;
}

export default BaseComponent