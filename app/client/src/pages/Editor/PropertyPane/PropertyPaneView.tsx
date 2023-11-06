import type { ReactElement } from "react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import equal from "fast-deep-equal/es6";
import { useDispatch, useSelector } from "react-redux";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import type { IPanelProps } from "@blueprintjs/core";

import PropertyPaneTitle from "./PropertyPaneTitle";
import PropertyControlsGenerator from "./PropertyControlsGenerator";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { copyWidget, deleteSelectedWidget } from "actions/widgetActions";
import ConnectDataCTA, { actionsExist } from "./ConnectDataCTA";
import PropertyPaneConnections from "./PropertyPaneConnections";
import type { WidgetType } from "constants/WidgetConstants";
import { WIDGET_ID_SHOW_WALKTHROUGH } from "constants/WidgetConstants";
import type { InteractionAnalyticsEventDetail } from "utils/AppsmithUtils";
import { INTERACTION_ANALYTICS_EVENT } from "utils/AppsmithUtils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { buildDeprecationWidgetMessage, isWidgetDeprecated } from "../utils";
import { Button, Callout } from "design-system";
import WidgetFactory from "WidgetProvider/factory";
import { PropertyPaneTab } from "./PropertyPaneTab";
import { renderWidgetCallouts, useSearchText } from "./helpers";
import { PropertyPaneSearchInput } from "./PropertyPaneSearchInput";
import { sendPropertyPaneSearchAnalytics } from "./propertyPaneSearch";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { AB_TESTING_EVENT_KEYS } from "@appsmith/entities/FeatureFlag";
import localStorage from "utils/localStorage";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import { PROPERTY_PANE_ID } from "components/editorComponents/PropertyPaneSidebar";
import {
  isUserSignedUpFlagSet,
  setFeatureWalkthroughShown,
} from "utils/storage";
import {
  BINDING_WIDGET_WALKTHROUGH_DESC,
  BINDING_WIDGET_WALKTHROUGH_TITLE,
  createMessage,
} from "@appsmith/constants/messages";
import { getWidgets } from "sagas/selectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";

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
  "TABLE_WIDGET_V2",
  "BUTTON_WIDGET_V2",
  "JSON_FORM_WIDGET",
];

function PropertyPaneView(
  props: {
    theme: EditorTheme;
  } & IPanelProps,
) {
  const dispatch = useDispatch();

  const panel = props;
  const widgetProperties = useSelector(getWidgetPropsForPropertyPane, equal);

  const user = useSelector(getCurrentUser);
  const doActionsExist = useSelector(actionsExist);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideConnectDataCTA = useMemo(() => {
    if (widgetProperties) {
      return excludeList.includes(widgetProperties.type);
    }

    return true;
  }, [widgetProperties]);
  const { searchText, setSearchText } = useSearchText("");
  const { pushFeature } = useContext(WalkthroughContext) || {};
  const widgets = useSelector(getWidgets);
  const { selectWidget } = useWidgetSelection();

  const showWalkthroughIfWidgetIdSet = async () => {
    const widgetId: string | null = await localStorage.getItem(
      WIDGET_ID_SHOW_WALKTHROUGH,
    );

    const isNewUser = user && (await isUserSignedUpFlagSet(user.email));

    // Adding table condition as connecting to select, chart widgets is currently not working as expected
    // When we fix those, we can remove this table condtion
    const isTableWidget = !!widgetId
      ? widgets[widgetId]?.type === "TABLE_WIDGET_V2"
      : false;

    if (isNewUser) {
      if (widgetId && pushFeature && isTableWidget) {
        pushFeature({
          targetId: `#${PROPERTY_PANE_ID}`,
          onDismiss: async () => {
            await localStorage.removeItem(WIDGET_ID_SHOW_WALKTHROUGH);
            await setFeatureWalkthroughShown(
              FEATURE_WALKTHROUGH_KEYS.binding_widget,
              true,
            );
          },
          details: {
            title: createMessage(BINDING_WIDGET_WALKTHROUGH_TITLE),
            description: createMessage(BINDING_WIDGET_WALKTHROUGH_DESC),
          },
          offset: {
            position: "left",
            left: -40,
            top: 250,
            highlightPad: 2,
            indicatorLeft: -3,
            indicatorTop: 230,
          },
          eventParams: {
            [AB_TESTING_EVENT_KEYS.abTestingFlagLabel]:
              FEATURE_WALKTHROUGH_KEYS.binding_widget,
            [AB_TESTING_EVENT_KEYS.abTestingFlagValue]: true,
          },
          multipleHighlights: [
            `#${CSS.escape(widgetId)}`,
            `#${PROPERTY_PANE_ID}`,
          ],
          delay: 2500,
          runBeforeWalkthrough: () => {
            try {
              selectWidget(SelectionRequestType.One, [widgetId]);
            } catch {}
          },
        });
      }
    } else {
      // If no user then remove the widget id from local storage as no walkthrough is shown to old users
      await localStorage.removeItem(WIDGET_ID_SHOW_WALKTHROUGH);
    }
  };

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
    showWalkthroughIfWidgetIdSet();
    return () => {
      containerRef.current?.removeEventListener(
        INTERACTION_ANALYTICS_EVENT,
        handleKbdEvent,
      );
    };
  }, []);

  /**
   * Analytics for property pane Search
   */
  useEffect(() => {
    sendPropertyPaneSearchAnalytics({
      widgetType: widgetProperties?.type ?? "",
      searchText,
      widgetName: widgetProperties?.widgetName ?? "",
      searchPath: "",
    });
  }, [searchText]);

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
    icon: ReactElement;
  }> => {
    return [
      {
        tooltipContent: "Copy widget",
        icon: (
          <Button
            data-testid="t--copy-widget"
            isIconButton
            kind="tertiary"
            onClick={onCopy}
            startIcon="duplicate"
          />
        ),
      },
      {
        tooltipContent: "Delete widget",
        icon: (
          <Button
            data-testid="t--delete-widget"
            isIconButton
            kind="tertiary"
            onClick={onDelete}
            startIcon="delete-bin-line"
          />
        ),
      },
    ];
  }, [onCopy, onDelete]);

  useEffect(() => {
    setSearchText("");
  }, [widgetProperties?.widgetId]);

  if (!widgetProperties) return null;

  // Building Deprecation Messages
  const { isDeprecated, widgetReplacedWith } = isWidgetDeprecated(
    widgetProperties.type,
  );
  // generate messages
  const deprecationMessage = buildDeprecationWidgetMessage(widgetReplacedWith);

  const isContentConfigAvailable =
    WidgetFactory.getWidgetPropertyPaneContentConfig(
      widgetProperties.type,
      widgetProperties,
    ).length;

  const isStyleConfigAvailable = WidgetFactory.getWidgetPropertyPaneStyleConfig(
    widgetProperties.type,
  ).length;

  return (
    <div
      className="w-full h-full overflow-y-scroll"
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
          <Callout data-testid="t--deprecation-warning" kind="warning">
            {deprecationMessage}
          </Callout>
        )}
        {renderWidgetCallouts(widgetProperties)}
      </div>

      <div
        className="t--property-pane-view"
        data-guided-tour-id="property-pane"
      >
        {isContentConfigAvailable || isStyleConfigAvailable ? (
          <>
            <PropertyPaneSearchInput onTextChange={setSearchText} />
            {searchText.length > 0 ? (
              <PropertyControlsGenerator
                config={WidgetFactory.getWidgetPropertyPaneSearchConfig(
                  widgetProperties.type,
                  widgetProperties,
                )}
                id={widgetProperties.widgetId}
                panel={panel}
                searchQuery={searchText}
                theme={EditorTheme.LIGHT}
                type={widgetProperties.type}
              />
            ) : (
              <PropertyPaneTab
                contentComponent={
                  isContentConfigAvailable ? (
                    <PropertyControlsGenerator
                      config={WidgetFactory.getWidgetPropertyPaneContentConfig(
                        widgetProperties.type,
                        widgetProperties,
                      )}
                      id={widgetProperties.widgetId}
                      panel={panel}
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
                      theme={EditorTheme.LIGHT}
                      type={widgetProperties.type}
                    />
                  ) : null
                }
              />
            )}
          </>
        ) : (
          <PropertyControlsGenerator
            config={WidgetFactory.getWidgetPropertyPaneConfig(
              widgetProperties.type,
              widgetProperties,
            )}
            id={widgetProperties.widgetId}
            panel={panel}
            theme={EditorTheme.LIGHT}
            type={widgetProperties.type}
          />
        )}
      </div>
    </div>
  );
}

export default PropertyPaneView;
