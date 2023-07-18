import { EditorContext } from "components/editorComponents/EditorContextProvider";
import type { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { useContext } from "react";
import AppsmithConsole from "utils/AppsmithConsole";

export const useBaseWidgetActions = (props: {
  widgetId: string;
  widgetName: string;
}) => {
  return (actionPayload: ExecuteTriggerPayload): void => {
    const { executeAction } = useContext(EditorContext);
    executeAction &&
      executeAction({
        ...actionPayload,
        source: {
          id: props.widgetId,
          name: props.widgetName,
        },
      });

    actionPayload.triggerPropertyName &&
      AppsmithConsole.info({
        text: `${actionPayload.triggerPropertyName} triggered`,
        source: {
          type: ENTITY_TYPE.WIDGET,
          id: props.widgetId,
          name: props.widgetName,
        },
      });
  };
};
