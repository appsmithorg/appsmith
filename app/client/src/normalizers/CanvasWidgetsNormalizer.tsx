import { normalize, schema, denormalize } from 'normalizr';
import { PageResponse } from '../api/PageApi';
import { IContainerWidgetProps } from '../widgets/ContainerWidget';

export const widgetSchema = new schema.Entity('canvasWidgets', { }, { idAttribute: "widgetId" }, );
const widgets = new schema.Array(widgetSchema);
widgetSchema.define({ children: widgets });

class CanvasWidgetsNormalizer {

    static normalize(pageResponse: PageResponse): { entities: any, result: any } {
        return normalize(pageResponse.pageWidget, widgetSchema)
    }

    static denormalize(pageWidgetId: string, entities: any): IContainerWidgetProps<any> {
        return denormalize(pageWidgetId, widgetSchema, entities)
    }

}

export default CanvasWidgetsNormalizer