import { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import { find } from "lodash";
import { AppState } from "reducers";
import { createSelector } from "reselect";
import { getWidgets } from "sagas/selectors";
import { getEntityNameAndPropertyPath } from "workers/evaluationUtils";
import { getCurrentPageId } from "./editorSelectors";

export const getEditorContext = (state: AppState) => state.ui.editorContext;

export const getWidgetContextSelector = (widgetId: string) => {
  return createSelector(
    getCurrentPageId,
    getEditorContext,
    (pageId, context) => {
      return context[pageId]?.widgets?.[widgetId];
    },
  );
};

export const getCursorSelector = (dataTreePath: string | undefined) => {
  return createSelector(
    getWidgets,
    getCurrentPageId,
    getEditorContext,
    (widgets, pageId, context) => {
      if (dataTreePath) {
        const { entityName, propertyPath } = getEntityNameAndPropertyPath(
          dataTreePath,
        );
        const widget = find(
          Object.values(widgets),
          (widget) => widget.widgetName === entityName,
        );

        if (!widget) return undefined;

        return context[pageId]?.codeEditor?.[widget.widgetId]?.[propertyPath]
          ?.cursorPosition;
      }
    },
  );
};

export const getCodePopupSelector = (
  entity: FieldEntityInformation | undefined,
) => {
  return createSelector(
    getWidgets,
    getCurrentPageId,
    getEditorContext,
    (widgets, pageId, context) => {
      if (entity) {
        const { entityName, propertyPath } = entity;

        const widget = find(
          Object.values(widgets),
          (widget) => widget.widgetName === entityName,
        );

        if (!widget) return undefined;

        return context[pageId]?.codeEditor?.[widget.widgetId]?.[
          propertyPath || ""
        ]?.evaluatedPopup;
      }
    },
  );
};
