import * as React from "react"
/***
 * Components are responsible for binding render inputs to corresponding UI SDKs
 */
abstract class BaseComponent<T extends IComponentProps> extends React.Component<T> {

    componentData: T

    constructor(componentProps: T) {
        super(componentProps)
        this.componentData = componentProps
    }

}

export interface BaseStyle {
    height?: number
    width?: number
}

export interface IComponentProps {
    widgetId: string
    style?: BaseStyle
}

export default BaseComponent