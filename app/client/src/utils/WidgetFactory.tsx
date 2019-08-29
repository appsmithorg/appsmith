import { WidgetType } from "../constants/WidgetConstants";
import { IWidgetBuilder, IWidgetProps } from "../widgets/BaseWidget";

class WidgetFactory {

    static widgetMap: Map<WidgetType, IWidgetBuilder<IWidgetProps>> = new Map()

    static registerWidgetBuilder(widgetType: WidgetType, widgetBuilder: IWidgetBuilder<IWidgetProps>) {
        this.widgetMap.set(widgetType, widgetBuilder)
    }

    static createWidget(widgetData: IWidgetProps): JSX.Element {
        widgetData.key = widgetData.widgetId
        const widgetBuilder = this.widgetMap.get(widgetData.widgetType)
        if (widgetBuilder)
            return widgetBuilder.buildWidget(widgetData)
        else {
            const ex: WidgetCreationException = {
                message: "Widget Builder not registered for widget type" + widgetData.widgetType
            }
            throw ex
        }
    }

    static getWidgetTypes(): WidgetType[] {
        return Array.from(this.widgetMap.keys());
    }

}

export interface WidgetCreationException {
    message: string;
}

export default WidgetFactory