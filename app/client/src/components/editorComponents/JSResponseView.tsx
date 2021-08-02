import React, { useState, useRef, RefObject } from "react";
import { connect, useSelector } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router";
import styled from "styled-components";
import { AppState } from "reducers";
import { ActionResponse } from "api/ActionAPI";
import { JSEditorRouteParams } from "constants/routes";
import LoadingOverlayScreen from "components/editorComponents/LoadingOverlayScreen";
import {
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
} from "constants/messages";
import { TabComponent } from "components/ads/Tabs";
import { Classes } from "components/ads/common";
import { EditorTheme } from "./CodeEditor/EditorConfig";
import DebuggerLogs from "./Debugger/DebuggerLogs";
import ErrorLogs from "./Debugger/Errors";
import Resizer, { ResizerCSS } from "./Debugger/Resizer";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getActionTabsInitialIndex } from "selectors/editorSelectors";
import { JSAction } from "entities/JSAction";

const ResponseContainer = styled.div`
  ${ResizerCSS}
  // Initial height of bottom tabs
  height: ${(props) => props.theme.actionsBottomTabInitialHeight};
  width: 100%;
  // Minimum height of bottom tabs as it can be resized
  min-height: 36px;
  background-color: ${(props) => props.theme.colors.apiPane.responseBody.bg};

  .react-tabs__tab-panel {
    overflow: hidden;
  }
`;

const ResponseTabWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const TabbedViewWrapper = styled.div`
  height: calc(100% - 30px);

  &&& {
    ul.react-tabs__tab-list {
      padding: 0px ${(props) => props.theme.spaces[12]}px;
    }
  }
`;

const SectionDivider = styled.div`
  height: 2px;
  width: 100%;
  background: ${(props) => props.theme.colors.apiPane.dividerBg};
`;

const Flex = styled.div`
  display: flex;
  align-items: center;
  margin-left: 20px;

  span:first-child {
    margin-right: ${(props) => props.theme.spaces[1] + 1}px;
  }
`;

interface ReduxStateProps {
  responses: Record<string, ActionResponse | undefined>;
  isRunning: Record<string, boolean>;
}

type Props = ReduxStateProps &
  RouteComponentProps<JSEditorRouteParams> & {
    theme?: EditorTheme;
    jsCollection: JSAction | undefined;
    onRunClick: () => void;
  };

function JSResponseView(props: Props) {
  const {
    jsCollection,
    match: {
      params: { collectionId },
    },
    responses,
  } = props;
  const isRunning = false;
  const hasFailed = false;

  const panelRef: RefObject<HTMLDivElement> = useRef(null);

  const initialIndex = useSelector(getActionTabsInitialIndex);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const tabs = [
    {
      key: "body",
      title: "Response",
      panelComponent: <ResponseTabWrapper />,
    },
    {
      key: "ERROR",
      title: createMessage(DEBUGGER_ERRORS),
      panelComponent: <ErrorLogs />,
    },
    {
      key: "LOGS",
      title: createMessage(DEBUGGER_LOGS),
      panelComponent: <DebuggerLogs searchQuery={jsCollection?.name} />,
    },
  ];

  const onTabSelect = (index: number) => {
    const debuggerTabKeys = ["ERROR", "LOGS"];
    if (
      debuggerTabKeys.includes(tabs[index].key) &&
      debuggerTabKeys.includes(tabs[selectedIndex].key)
    ) {
      AnalyticsUtil.logEvent("DEBUGGER_TAB_SWITCH", {
        tabName: tabs[index].key,
      });
    }
    setSelectedIndex(index);
  };

  return (
    <ResponseContainer ref={panelRef}>
      <Resizer panelRef={panelRef} />
      <TabbedViewWrapper>
        <TabComponent
          onSelect={onTabSelect}
          selectedIndex={selectedIndex}
          tabs={tabs}
        />
      </TabbedViewWrapper>
    </ResponseContainer>
  );
}

const mapStateToProps = (state: AppState): ReduxStateProps => {
  return {
    responses: {},
    isRunning: {},
  };
};

export default connect(mapStateToProps)(withRouter(JSResponseView));
