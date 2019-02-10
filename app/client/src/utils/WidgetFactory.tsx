import { WidgetType } from "../constants/WidgetConstants";
import BaseWidget, { IWidgetBuilder, IWidgetProps } from "../widgets/BaseWidget";
import { IComponentProps } from "../editorComponents/BaseComponent";

class WidgetFactory {

    static widgetMap: Map<WidgetType, IWidgetBuilder<IWidgetProps, IComponentProps>> = new Map()

    static registerWidgetBuilder(widgetType: WidgetType, widgetBuilder: IWidgetBuilder<IWidgetProps, IComponentProps>) {
        this.widgetMap.set(widgetType, widgetBuilder)
    }

    static createWidget(widgetData: IWidgetProps): BaseWidget<IWidgetProps, IComponentProps> {
        const widgetBuilder = this.widgetMap.get(widgetData.widgetType)
        if (widgetBuilder)
            return widgetBuilder.buildWidget(widgetData)
        else {
            const ex: IWidgetCreationException = {
                message: "Widget Builder not registered for widget type" + widgetData.widgetType
            }
            throw ex
        }
    }

}

export interface IWidgetCreationException {
    message: string
}

export default WidgetFactory