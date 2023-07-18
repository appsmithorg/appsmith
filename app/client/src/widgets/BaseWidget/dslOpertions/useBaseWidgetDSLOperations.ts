import type { BatchPropertyUpdatePayload } from "actions/controlActions";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { useContext } from "react";

export const useBaseWidgetDSLOperations = (props: { widgetId: string }) => {
  const { updateWidget, deleteWidgetProperty, batchUpdateWidgetProperty } =
    useContext(EditorContext);
  return {
    updateWidget: (
      operationName: string,
      widgetId: string,
      widgetProperties: any,
    ): void => {
      updateWidget && updateWidget(operationName, widgetId, widgetProperties);
    },
    deleteWidgetProperty: (propertyPaths: string[]): void => {
      const { widgetId } = props;
      if (deleteWidgetProperty && widgetId) {
        deleteWidgetProperty(widgetId, propertyPaths);
      }
    },
    batchUpdateWidgetProperty: (
      updates: BatchPropertyUpdatePayload,
      shouldReplay = true,
    ): void => {
      const { widgetId } = props;
      if (batchUpdateWidgetProperty && widgetId) {
        batchUpdateWidgetProperty(widgetId, updates, shouldReplay);
      }
    },
    updateWidgetProperty(propertyName: string, propertyValue: any): void {
      this.batchUpdateWidgetProperty({
        modify: { [propertyName]: propertyValue },
      });
    },
  };
};
