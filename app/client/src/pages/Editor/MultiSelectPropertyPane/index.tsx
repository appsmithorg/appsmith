import React from "react";
import * as Sentry from "@sentry/react";
import {
  createMessage,
  MULTI_SELECT_PROPERTY_PANE_MESSAGE,
} from "@appsmith/constants/messages";
import { useSelector } from "react-redux";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import { getSelectedWidgets } from "selectors/ui";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";

function MultiSelectPropertyPane() {
  const { focusWidget, selectWidget } = useWidgetSelection();
  const selectedWidgets = useSelector(getSelectedWidgets);
  const canvasWidgets = useSelector(getCanvasWidgets);

  return (
    <div className="relative space-y-3">
      <div className="px-3 py-3">
        <h3 className="text-sm font-medium uppercase">Multi</h3>
      </div>

      <div className="px-3 space-y-3 t--layout-control-wrapper">
        <p className="text-sm text-gray-700">
          {createMessage(MULTI_SELECT_PROPERTY_PANE_MESSAGE)}
        </p>
        <div className="flex flex-col space-y-3">
          {selectedWidgets.map((selectedWidgetId) => {
            if (!canvasWidgets[selectedWidgetId]) return;

            return (
              <button
                className="py-1 border border-gray-300 hover:border-gray-500"
                key={selectedWidgetId}
                onClick={() => {
                  selectWidget(selectedWidgetId);
                  focusWidget(selectedWidgetId);
                }}
              >
                {canvasWidgets[selectedWidgetId].widgetName}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

MultiSelectPropertyPane.displayName = "MultiSelectPropertyPane";

export default Sentry.withProfiler(MultiSelectPropertyPane);
