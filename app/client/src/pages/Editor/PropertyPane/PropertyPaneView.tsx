import React, { ReactElement, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import { IPanelProps, Position } from "@blueprintjs/core";

import PropertyPaneTitle from "pages/Editor/PropertyPaneTitle";
import PropertyControlsGenerator from "./Generator";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { deleteSelectedWidget, copyWidget } from "actions/widgetActions";
import ConnectDataCTA, { actionsExist } from "./ConnectDataCTA";
import PropertyPaneConnections from "./PropertyPaneConnections";
import CopyIcon from "remixicon-react/FileCopyLineIcon";
import DeleteIcon from "remixicon-react/DeleteBinLineIcon";
import { WidgetType } from "constants/WidgetConstants";

// TODO(abhinav): The widget should add a flag in their configuration if they donot subscribe to data
// Widgets where we do not want to show the CTA
export const excludeList: WidgetType[] = [
  "CONTAINER_WIDGET",
  "TABS_WIDGET",
  "FORM_WIDGET",
  "MODAL_WIDGET",
  "DIVIDER_WIDGET",
  "FILE_PICKER_WIDGET",
  "BUTTON_WIDGET",
  "CANVAS_WIDGET",
  "AUDIO_RECORDER_WIDGET",
  "IFRAME_WIDGET",
  "FILE_PICKER_WIDGET",
  "FILE_PICKER_WIDGET_V2",
];

function PropertyPaneView(
  props: {
    theme: EditorTheme;
  } & IPanelProps,
) {
  const dispatch = useDispatch();
  const { ...panel } = props;
  const widgetProperties: any = useSelector(getWidgetPropsForPropertyPane);
  const doActionsExist = useSelector(actionsExist);
  const hideConnectDataCTA = useMemo(() => {
    if (widgetProperties) {
      return excludeList.includes(widgetProperties.type);
    }

    return true;
  }, [widgetProperties?.type, excludeList]);

  /**
   * on delete button click
   */
  const onDelete = useCallback(() => {
    dispatch(deleteSelectedWidget(false));
  }, [dispatch]);

  /**
   * on  copy button click
   */
  const onCopy = useCallback(() => dispatch(copyWidget(false)), [dispatch]);

  /**
   * actions shown on the right of title
   */
  const actions = useMemo((): Array<{
    tooltipContent: any;
    tooltipPosition: Position;
    icon: ReactElement;
  }> => {
    return [
      {
        tooltipContent: "Copy Widget",
        tooltipPosition: "bottom-right",
        icon: (
          <button
            className="p-1 hover:bg-warmGray-100 group t--copy-widget"
            onClick={onCopy}
          >
            <CopyIcon className="w-4 h-4 text-gray-500" />
          </button>
        ),
      },
      {
        tooltipContent: "Delete Widget",
        tooltipPosition: "bottom-right",
        icon: (
          <button
            className="p-1 hover:bg-warmGray-100 group t--delete-widget"
            onClick={onDelete}
          >
            <DeleteIcon className="w-4 h-4 text-gray-500" />
          </button>
        ),
      },
    ];
  }, [onCopy, onDelete]);

  if (!widgetProperties) return null;

  return (
    <div
      className="relative flex flex-col w-full pt-3 overflow-y-auto"
      key={`property-pane-${widgetProperties.widgetId}`}
    >
      <PropertyPaneTitle
        actions={actions}
        key={widgetProperties.widgetId}
        title={widgetProperties.widgetName}
        widgetId={widgetProperties.widgetId}
        widgetType={widgetProperties?.type}
      />

      <div
        className="p-3 pb-24 overflow-x-hidden overflow-y-scroll t--property-pane-view"
        data-guided-tour-id="property-pane"
      >
        {!doActionsExist && !hideConnectDataCTA && (
          <ConnectDataCTA
            widgetId={widgetProperties.widgetId}
            widgetTitle={widgetProperties.widgetName}
            widgetType={widgetProperties?.type}
          />
        )}
        <PropertyPaneConnections widgetName={widgetProperties.widgetName} />

        <PropertyControlsGenerator
          id={widgetProperties.widgetId}
          panel={panel}
          theme={EditorTheme.LIGHT}
          type={widgetProperties.type}
        />
      </div>
    </div>
  );
}

export default PropertyPaneView;
