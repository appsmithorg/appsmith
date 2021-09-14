import React, { Component, ReactElement, useCallback, useMemo } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import {
  getIsPropertyPaneVisible,
  getWidgetPropsForPropertyPane,
} from "selectors/propertyPaneSelectors";
import {
  PanelStack,
  IPanel,
  Classes,
  IPanelProps,
  Icon,
} from "@blueprintjs/core";

import { ReduxActionTypes } from "constants/ReduxActionConstants";
import styled from "constants/DefaultTheme";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyPaneTitle from "pages/Editor/PropertyPaneTitle";
import AnalyticsUtil from "utils/AnalyticsUtil";
import * as log from "loglevel";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import PropertyControlsGenerator from "./Generator";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { ThemeMode, getCurrentThemeMode } from "selectors/themeSelectors";
import { deleteSelectedWidget, copyWidget } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { ControlIcons } from "icons/ControlIcons";
import { FormIcons } from "icons/FormIcons";
import PropertyPaneHelpButton from "pages/Editor/PropertyPaneHelpButton";
import { getProppanePreference } from "selectors/usersSelectors";
import { PropertyPanePositionConfig } from "reducers/uiReducers/usersReducer";
import { get } from "lodash";
import ConnectDataCTA, { actionsExist } from "./ConnectDataCTA";
import PropertyPaneConnections from "./PropertyPaneConnections";

const StyledPanelStack = styled(PanelStack)`
  height: 100%;
  width: 100%;
  margin: 0;
  &&& .bp3-panel-stack-view {
    margin: 0;
    border: none;
  }
  overflow: visible;
  position: static;
  &&& .${Classes.PANEL_STACK_VIEW} {
    position: static;
    overflow: hidden;
    height: 100%;
  }
`;

const CopyIcon = ControlIcons.COPY_CONTROL;
const DeleteIcon = FormIcons.DELETE_ICON;
interface PropertyPaneState {
  currentPanelStack: IPanel[];
}

export const PropertyControlsWrapper = styled.div`
  overflow: hidden;
  margin: ${(props) => props.theme.spaces[5]}px;
  margin-top: 0px;
`;

export const FixedHeader = styled.div`
  position: fixed;
  z-index: 3;
`;

export const PropertyPaneBodyWrapper = styled.div`
  margin-top: ${(props) => props.theme.propertyPane.titleHeight}px;
  overflow: auto;
`;

// TODO(abhinav): The widget should add a flag in their configuration if they donot subscribe to data
// Widgets where we do not want to show the CTA
export const excludeList = [
  "CONTAINER_WIDGET",
  "TABS_WIDGET",
  "FORM_WIDGET",
  "MODAL_WIDGET",
  "DIVIDER_WIDGET",
  "FILE_PICKER_WIDGET",
  "BUTTON_WIDGET",
  "CANVAS_WIDGET",
];

function PropertyPaneView(
  props: {
    hidePropertyPane: () => void;
    theme: EditorTheme;
  } & IPanelProps,
) {
  const { hidePropertyPane, theme, ...panel } = props;
  const widgetProperties: any = useSelector(getWidgetPropsForPropertyPane);
  const doActionsExist = useSelector(actionsExist);
  const hideConnectDataCTA = useMemo(() => {
    if (widgetProperties) {
      return excludeList.includes(widgetProperties.type);
    }

    return true;
  }, [widgetProperties?.type, excludeList]);

  const dispatch = useDispatch();
  const handleDelete = useCallback(() => {
    dispatch(deleteSelectedWidget(false));
  }, [dispatch]);
  const handleCopy = useCallback(() => dispatch(copyWidget(false)), [dispatch]);

  const actions = useMemo((): Array<{
    tooltipContent: any;
    icon: ReactElement;
  }> => {
    return [
      {
        tooltipContent: "Copy Widget",
        icon: (
          <CopyIcon
            className="t--copy-widget"
            height={14}
            onClick={handleCopy}
            width={14}
          />
        ),
      },
      {
        tooltipContent: "Delete Widget",
        icon: (
          <DeleteIcon
            className="t--delete-widget"
            height={16}
            onClick={handleDelete}
            width={16}
          />
        ),
      },
      {
        tooltipContent: <span>Explore widget related docs</span>,
        icon: <PropertyPaneHelpButton />,
      },
    ];
  }, [hidePropertyPane, handleCopy, handleDelete]);
  if (!widgetProperties) return null;

  return (
    <>
      <PropertyPaneTitle
        actions={actions}
        key={widgetProperties.widgetId}
        title={widgetProperties.widgetName}
        widgetId={widgetProperties.widgetId}
        widgetType={widgetProperties?.type}
      />

      <PropertyPaneBodyWrapper>
        {!doActionsExist && !hideConnectDataCTA && (
          <ConnectDataCTA
            widgetId={widgetProperties.widgetId}
            widgetTitle={widgetProperties.widgetName}
            widgetType={widgetProperties?.type}
          />
        )}
        <PropertyPaneConnections widgetName={widgetProperties.widgetName} />
        <PropertyControlsWrapper>
          <PropertyControlsGenerator
            id={widgetProperties.widgetId}
            panel={panel}
            theme={theme}
            type={widgetProperties.type}
          />
        </PropertyControlsWrapper>
      </PropertyPaneBodyWrapper>
    </>
  );
}

class PropertyPane extends Component<PropertyPaneProps, PropertyPaneState> {
  private panelWrapperRef = React.createRef<HTMLDivElement>();

  getTheme() {
    return EditorTheme.LIGHT;
  }

  getPopperTheme() {
    return ThemeMode.LIGHT;
  }

  onPositionChange = (position: any) => {
    this.props.setPropPanePoistion(
      position,
      this.props.widgetProperties?.widgetId,
    );
  };

  render() {
    if (
      !get(this.props, "widgetProperties") ||
      get(this.props, "widgetProperties.disablePropertyPane")
    ) {
      return null;
    }

    if (this.props.isVisible) {
      log.debug("Property pane rendered");
      const content = this.renderPropertyPane();
      return content;
    } else {
      return null;
    }
  }

  renderPropertyPane() {
    const { widgetProperties } = this.props;

    if (!widgetProperties) {
      return null;
    }

    // if settings control is disabled, don't render anything
    // for e.g - this will be true for list widget tempalte container widget
    if (widgetProperties?.disablePropertyPane) return null;

    return (
      <div
        className={"t--propertypane w-full h-full"}
        data-testid={"t--propertypane"}
        onClick={(e: any) => {
          e.stopPropagation();
        }}
        ref={this.panelWrapperRef}
      >
        <StyledPanelStack
          initialPanel={{
            component: PropertyPaneView,
            props: {
              hidePropertyPane: this.props.hidePropertyPane,
              theme: this.getTheme(),
            },
          }}
          onOpen={() => {
            const parent = this.panelWrapperRef.current;
            parent?.scrollTo(0, 0);
          }}
          showPanelHeader={false}
        />
      </div>
    );
  }

  componentDidMount() {
    PerformanceTracker.stopTracking(
      PerformanceTransactionName.OPEN_PROPERTY_PANE,
    );
  }

  componentDidUpdate(prevProps: PropertyPaneProps) {
    if (
      this.props.widgetProperties?.widgetId !==
        prevProps.widgetProperties?.widgetId &&
      this.props.widgetProperties?.widgetId !== undefined
    ) {
      PerformanceTracker.stopTracking(
        PerformanceTransactionName.OPEN_PROPERTY_PANE,
      );
      if (prevProps.widgetProperties?.widgetId && prevProps.widgetProperties) {
        AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE", {
          widgetType: prevProps.widgetProperties.type,
          widgetId: prevProps.widgetProperties.widgetId,
        });
      }
      if (this.props.widgetProperties) {
        AnalyticsUtil.logEvent("PROPERTY_PANE_OPEN", {
          widgetType: this.props.widgetProperties.type,
          widgetId: this.props.widgetProperties.widgetId,
        });
      }
    }

    if (
      this.props.widgetProperties?.widgetId ===
        prevProps.widgetProperties?.widgetId &&
      this.props.isVisible &&
      !prevProps.isVisible &&
      this.props.widgetProperties !== undefined
    ) {
      AnalyticsUtil.logEvent("PROPERTY_PANE_OPEN", {
        widgetType: this.props.widgetProperties.type,
        widgetId: this.props.widgetProperties.widgetId,
      });
    }

    return true;
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    widgetProperties: getWidgetPropsForPropertyPane(state),
    isVisible: getIsPropertyPaneVisible(state),
    themeMode: getCurrentThemeMode(state),
    propPanePreference: getProppanePreference(state),
  };
};

const mapDispatchToProps = (dispatch: any): PropertyPaneFunctions => {
  return {
    setPropPanePoistion: (position: any, widgetId: any) => {
      dispatch({
        type: ReduxActionTypes.PROP_PANE_MOVED,
        payload: {
          position: {
            left: position.left,
            top: position.top,
          },
        },
      });
      dispatch(selectWidgetInitAction(widgetId));
    },
    hidePropertyPane: () =>
      dispatch({
        type: ReduxActionTypes.HIDE_PROPERTY_PANE,
      }),
  };
};

export interface PropertyPaneProps extends PropertyPaneFunctions {
  widgetProperties?: WidgetProps;
  isVisible: boolean;
  themeMode: ThemeMode;
  propPanePreference?: PropertyPanePositionConfig;
}

export interface PropertyPaneFunctions {
  hidePropertyPane: () => void;
  setPropPanePoistion: (position: any, widgetId: any) => void;
}

export default connect(mapStateToProps, mapDispatchToProps)(PropertyPane);
