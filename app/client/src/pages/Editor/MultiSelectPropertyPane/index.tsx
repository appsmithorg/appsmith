import React from "react";
import * as Sentry from "@sentry/react";
import {
  createMessage,
  MULTI_SELECT_PROPERTY_PANE_MESSAGE,
} from "@appsmith/constants/messages";
import { Text, Button } from "design-system";
import { useSelector } from "react-redux";
import { getCanvasWidgets } from "@appsmith/selectors/entitiesSelector";
import { getSelectedWidgets } from "selectors/ui";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";

function MultiSelectPropertyPane() {
  const { focusWidget, selectWidget } = useWidgetSelection();
  const selectedWidgets = useSelector(getSelectedWidgets);
  const canvasWidgets = useSelector(getCanvasWidgets);

  return (
    <div className="relative space-y-3">
      <div className="px-3 py-3">
        <Text kind="heading-s" renderAs="h3">
          Multi
        </Text>
      </div>

      <div className="px-3 space-y-3 t--layout-control-wrapper">
        <Text kind="action-m" renderAs="p">
          {createMessage(MULTI_SELECT_PROPERTY_PANE_MESSAGE)}
        </Text>

        <div className="flex flex-col space-y-3 t-multi-widget-property-pane">
          {selectedWidgets.map((selectedWidgetId) => {
            if (!canvasWidgets[selectedWidgetId]) return;

            return (
              <Button
                className={`py-1 t-multi-widget-button-${selectedWidgetId}`}
                key={selectedWidgetId}
                kind="secondary"
                onClick={() => {
                  selectWidget(SelectionRequestType.One, [selectedWidgetId]);
                  focusWidget(selectedWidgetId);
                }}
                size="md"
              >
                {canvasWidgets[selectedWidgetId].widgetName}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

MultiSelectPropertyPane.displayName = "MultiSelectPropertyPane";

export default Sentry.withProfiler(MultiSelectPropertyPane);
