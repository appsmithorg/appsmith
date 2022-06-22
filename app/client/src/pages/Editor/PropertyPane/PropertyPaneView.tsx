import React, { ReactElement, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import { IPanelProps, Position } from "@blueprintjs/core";

import PropertyPaneTitle from "pages/Editor/PropertyPaneTitle";
import PropertyControlsGenerator, { PropertyPaneGroup } from "./Generator";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { deleteSelectedWidget, copyWidget } from "actions/widgetActions";
import ConnectDataCTA, { actionsExist } from "./ConnectDataCTA";
import PropertyPaneConnections from "./PropertyPaneConnections";
import CopyIcon from "remixicon-react/FileCopyLineIcon";
import DeleteIcon from "remixicon-react/DeleteBinLineIcon";
import { WidgetType } from "constants/WidgetConstants";
import { isWidgetDeprecated } from "../utils";
import { BannerMessage } from "components/ads/BannerMessage";
import { Colors } from "constants/Colors";
import { IconSize, SearchInput, SearchVariant } from "components/ads";
import {
  createMessage,
  WIDGET_DEPRECATION_WARNING,
  WIDGET_DEPRECATION_WARNING_HEADER,
} from "@appsmith/constants/messages";
import { TabComponent } from "components/ads/Tabs";
import { selectFeatureFlags } from "selectors/usersSelectors";
import WidgetFactory from "utils/WidgetFactory";
import styled from "styled-components";
import { InputWrapper } from "components/ads/TextInput";

const PropertyPaneContent = styled.div`
  .react-tabs__tab-list {
    border-bottom: 1px solid ${Colors.GREY_4};
    padding: 0 0.5rem;
  }

  .tab-title {
    font-size: 12px;
  }
`;

const StyledSearchInput = styled(SearchInput)`
  ${InputWrapper} {
    background: ${Colors.GRAY_50};
  }
`;

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
  const featureFlags = useSelector(selectFeatureFlags);
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
            className="p-1 hover:bg-warmGray-100 focus:bg-warmGray-100 group t--copy-widget"
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
            className="p-1 hover:bg-warmGray-100 focus:bg-warmGray-100 group t--delete-widget"
            onClick={onDelete}
          >
            <DeleteIcon className="w-4 h-4 text-gray-500" />
          </button>
        ),
      },
    ];
  }, [onCopy, onDelete]);

  if (!widgetProperties) return null;

  // Building Deprecation Messages
  const isDeprecated = isWidgetDeprecated(widgetProperties.type);
  const widgetDisplayName = widgetProperties.displayName
    ? `${widgetProperties.displayName} `
    : "";
  // generate messages
  const deprecationMessage = createMessage(
    WIDGET_DEPRECATION_WARNING,
    widgetDisplayName,
  );
  const deprecationHeader = createMessage(WIDGET_DEPRECATION_WARNING_HEADER);

  // TODO(aswathkk): remove this when PROPERTY_PANE_GROUPING feature is released
  const isContentAndStyleConfigAvailable =
    WidgetFactory.getWidgetPropertyPaneContentConfig(widgetProperties.type)
      .length &&
    WidgetFactory.getWidgetPropertyPaneStyleConfig(widgetProperties.type)
      .length;

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

      <PropertyPaneContent
        className="pt-3 t--property-pane-view"
        data-guided-tour-id="property-pane"
      >
        <PropertyPaneConnections widgetName={widgetProperties.widgetName} />
        {!doActionsExist && !hideConnectDataCTA && (
          <ConnectDataCTA
            widgetId={widgetProperties.widgetId}
            widgetTitle={widgetProperties.widgetName}
            widgetType={widgetProperties?.type}
          />
        )}
        {isDeprecated && (
          <BannerMessage
            backgroundColor={Colors.WARNING_ORANGE}
            className="t--deprecation-warning"
            icon="warning-line"
            iconColor={Colors.WARNING_SOLID}
            iconSize={IconSize.XXXXL}
            message={deprecationMessage}
            messageHeader={deprecationHeader}
            textColor={Colors.BROWN}
          />
        )}
        {featureFlags.PROPERTY_PANE_GROUPING &&
        isContentAndStyleConfigAvailable ? (
          <>
            <StyledSearchInput
              fill
              placeholder="Search for controls, labels etc"
              variant={SearchVariant.BACKGROUND}
            />
            <TabComponent
              tabs={[
                {
                  key: "content",
                  title: "CONTENT",
                  panelComponent: (
                    <PropertyControlsGenerator
                      group={PropertyPaneGroup.CONTENT}
                      id={widgetProperties.widgetId}
                      panel={panel}
                      theme={EditorTheme.LIGHT}
                      type={widgetProperties.type}
                    />
                  ),
                },
                {
                  key: "style",
                  title: "STYLE",
                  panelComponent: (
                    <PropertyControlsGenerator
                      group={PropertyPaneGroup.STYLE}
                      id={widgetProperties.widgetId}
                      panel={panel}
                      theme={EditorTheme.LIGHT}
                      type={widgetProperties.type}
                    />
                  ),
                },
              ]}
            />
          </>
        ) : (
          <PropertyControlsGenerator
            id={widgetProperties.widgetId}
            panel={panel}
            theme={EditorTheme.LIGHT}
            type={widgetProperties.type}
          />
        )}
      </PropertyPaneContent>
    </div>
  );
}

export default PropertyPaneView;
