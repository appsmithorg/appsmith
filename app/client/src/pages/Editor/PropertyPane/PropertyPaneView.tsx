import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import equal from "fast-deep-equal/es6";
import { useDispatch, useSelector } from "react-redux";
import { getWidgetPropsForPropertyPaneView } from "selectors/propertyPaneSelectors";
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
import {
  InteractionAnalyticsEventDetail,
  INTERACTION_ANALYTICS_EVENT,
} from "utils/AppsmithUtils";
import { emitInteractionAnalyticsEvent } from "utils/AppsmithUtils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { buildDeprecationWidgetMessage, isWidgetDeprecated } from "../utils";
import { BannerMessage } from "components/ads/BannerMessage";
import { Colors } from "constants/Colors";
import {
  IconSize,
  InputWrapper,
  SearchInput,
  SearchVariant,
} from "design-system";
import WidgetFactory from "utils/WidgetFactory";
import styled from "styled-components";
import { PropertyPaneTab } from "./PropertyPaneTab";
import { useSearchText } from "./helpers";

export const StyledSearchInput = React.memo(styled(SearchInput)`
  position: sticky;
  top: 46px;
  z-index: 3;

  ${InputWrapper} {
    background: ${Colors.GRAY_50};
    padding: 0 8px;
    height: 32px;
  }
`);

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
  const widgetProperties = useSelector(
    getWidgetPropsForPropertyPaneView,
    equal,
  );
  const doActionsExist = useSelector(actionsExist);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideConnectDataCTA = useMemo(() => {
    if (widgetProperties) {
      return excludeList.includes(widgetProperties.type);
    }

    return true;
  }, [widgetProperties?.type, excludeList]);
  const { searchText, setSearchText } = useSearchText("");

  const handleKbdEvent = (e: Event) => {
    const event = e as CustomEvent<InteractionAnalyticsEventDetail>;
    AnalyticsUtil.logEvent("PROPERTY_PANE_KEYPRESS", {
      key: event.detail.key,
      propertyName: event.detail.propertyName,
      propertyType: event.detail.propertyType,
      widgetType: event.detail.widgetType,
    });
  };

  useEffect(() => {
    containerRef.current?.addEventListener(
      INTERACTION_ANALYTICS_EVENT,
      handleKbdEvent,
    );
    return () => {
      containerRef.current?.removeEventListener(
        INTERACTION_ANALYTICS_EVENT,
        handleKbdEvent,
      );
    };
  }, []);

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

  const handleTabKeyDownForButton = useCallback(
    (propertyName: string) => (e: React.KeyboardEvent) => {
      if (e.key === "Tab")
        emitInteractionAnalyticsEvent(containerRef?.current, {
          key: e.key,
          propertyName,
          propertyType: "BUTTON",
          widgetType: widgetProperties?.type,
        });
    },
    [],
  );

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
            onKeyDown={handleTabKeyDownForButton("widgetCopy")}
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
            onKeyDown={handleTabKeyDownForButton("widgetDelete")}
          >
            <DeleteIcon className="w-4 h-4 text-gray-500" />
          </button>
        ),
      },
    ];
  }, [onCopy, onDelete, handleTabKeyDownForButton]);

  useEffect(() => {
    setSearchText("");
  }, [widgetProperties.widgetId]);

  if (!widgetProperties) return null;

  // Building Deprecation Messages
  const {
    currentWidgetName,
    isDeprecated,
    widgetReplacedWith,
  } = isWidgetDeprecated(widgetProperties.type);
  // generate messages
  const deprecationMessage = buildDeprecationWidgetMessage(
    currentWidgetName,
    widgetReplacedWith,
  );

  const isContentConfigAvailable = WidgetFactory.getWidgetPropertyPaneContentConfig(
    widgetProperties.type,
  ).length;

  const isStyleConfigAvailable = WidgetFactory.getWidgetPropertyPaneStyleConfig(
    widgetProperties.type,
  ).length;

  return (
    <div
      className="w-full overflow-y-auto"
      key={`property-pane-${widgetProperties.widgetId}`}
      ref={containerRef}
    >
      <PropertyPaneTitle
        actions={actions}
        key={widgetProperties.widgetId}
        title={widgetProperties.widgetName}
        widgetId={widgetProperties.widgetId}
        widgetType={widgetProperties?.type}
      />

      <div style={{ marginTop: "52px" }}>
        <PropertyPaneConnections
          widgetName={widgetProperties.widgetName}
          widgetType={widgetProperties.type}
        />
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
            textColor={Colors.BROWN}
          />
        )}
      </div>

      <div
        className="t--property-pane-view"
        data-guided-tour-id="property-pane"
      >
        {isContentConfigAvailable || isStyleConfigAvailable ? (
          <>
            {// TODO(aswathkk): Fix #15970 and show search bar
            false && (
              <StyledSearchInput
                className="propertyPaneSearch"
                fill
                onChange={setSearchText}
                placeholder="Search for controls, labels etc"
                variant={SearchVariant.BACKGROUND}
              />
            )}
            <PropertyPaneTab
              contentComponent={
                isContentConfigAvailable ? (
                  <PropertyControlsGenerator
                    config={WidgetFactory.getWidgetPropertyPaneContentConfig(
                      widgetProperties.type,
                    )}
                    id={widgetProperties.widgetId}
                    panel={panel}
                    searchQuery={searchText}
                    theme={EditorTheme.LIGHT}
                    type={widgetProperties.type}
                  />
                ) : null
              }
              styleComponent={
                isStyleConfigAvailable ? (
                  <PropertyControlsGenerator
                    config={WidgetFactory.getWidgetPropertyPaneStyleConfig(
                      widgetProperties.type,
                    )}
                    id={widgetProperties.widgetId}
                    panel={panel}
                    searchQuery={searchText}
                    theme={EditorTheme.LIGHT}
                    type={widgetProperties.type}
                  />
                ) : null
              }
            />
          </>
        ) : (
          <PropertyControlsGenerator
            config={WidgetFactory.getWidgetPropertyPaneConfig(
              widgetProperties.type,
            )}
            id={widgetProperties.widgetId}
            panel={panel}
            searchQuery={searchText}
            theme={EditorTheme.LIGHT}
            type={widgetProperties.type}
          />
        )}
      </div>
    </div>
  );
}

export default PropertyPaneView;
