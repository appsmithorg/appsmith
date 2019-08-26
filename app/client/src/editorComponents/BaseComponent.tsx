import { Component } from "react"
import React from "react"
import { PositionType, CSSUnit } from "../constants/WidgetConstants"
import { Color } from "../constants/StyleConstants"
/***
 * Components are responsible for binding render inputs to corresponding UI SDKs
 */
abstract class BaseComponent<T extends IComponentProps> extends Component<T> {

    constructor(componentProps: T) {
        super(componentProps)
    }

}

export interface BaseStyle {
    height?: number
    width?: number
    positionType: PositionType
    xPosition: number
    yPosition: number
    xPositionUnit: CSSUnit
    yPositionUnit: CSSUnit
    heightUnit?: CSSUnit
    widthUnit?: CSSUnit
    backgroundColor?: Color

}

export interface IComponentProps {
    widgetId: string
    style: BaseStyle
}

export default BaseComponent