import type { IPanelProps } from "@blueprintjs/core";
import equal from "fast-deep-equal/es6";
import type { ReactElement } from "react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";

import {
  BINDING_WIDGET_WALKTHROUGH_DESC,
  BINDING_WIDGET_WALKTHROUGH_TITLE,
  CONTEXT_INSPECT_STATE,
  createMessage,
} from "ee/constants/messages";
import { AB_TESTING_EVENT_KEYS } from "ee/entities/FeatureFlag";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import WidgetFactory from "WidgetProvider/factory";
import { copyWidget, deleteSelectedWidget } from "actions/widgetActions";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { PROPERTY_PANE_ID } from "components/editorComponents/PropertyPaneSidebar";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import type { WidgetType } from "constants/WidgetConstants";
import { WIDGET_ID_SHOW_WALKTHROUGH } from "constants/WidgetConstants";
import { Button } from "@appsmith/ads";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getWidgets } from "sagas/selectors";
import { getCurrentUser } from "selectors/usersSelectors";
import type { InteractionAnalyticsEventDetail } from "utils/AppsmithUtils";
import { INTERACTION_ANALYTICS_EVENT } from "utils/AppsmithUtils";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import localStorage from "utils/localStorage";
import {
  isUserSignedUpFlagSet,
  setFeatureWalkthroughShown,
} from "utils/storage";
import ConnectDataCTA, { actionsExist } from "./ConnectDataCTA";
import PropertyControlsGenerator from "./PropertyControlsGenerator";
import PropertyPaneConnections from "./PropertyPaneConnections";
import { PropertyPaneSearchInput } from "./PropertyPaneSearchInput";
import { PropertyPaneTab } from "./PropertyPaneTab";
import PropertyPaneTitle from "./PropertyPaneTitle";
import { renderWidgetCallouts, useSearchText } from "./helpers";
import { sendPropertyPaneSearchAnalytics } from "./propertyPaneSearch";
import { InspectStateToolbarButton } from "components/editorComponents/Debugger/StateInspector/CTAs";

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
  "CUSTOM_WIDGET",
  "ZONE_WIDGET",
  "SECTION_WIDGET",
  "WDS_MODAL_WIDGET",
  "WDS_BUTTON_WIDGET",
  "WDS_TABLE_WIDGET",
  "MODULE_CONTAINER_WIDGET",
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
    tooltipContent: string;
    icon: ReactElement;
  }> => {
    const widgetActions = [
      {
        tooltipContent: createMessage(CONTEXT_INSPECT_STATE),
        icon: (
          <InspectStateToolbarButton
            entityId={widgetProperties?.widgetId || ""}
          />
        ),
      },
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
    ];

    if (widgetProperties?.isDeletable !== false) {
      widgetActions.push({
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
      });
    }

    return widgetActions;
  }, [
    onCopy,
    onDelete,
    widgetProperties?.isDeletable,
    widgetProperties?.widgetId,
  ]);

  useEffect(() => {
    setSearchText("");
  }, [widgetProperties?.widgetId]);

  if (!widgetProperties) return null;

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
