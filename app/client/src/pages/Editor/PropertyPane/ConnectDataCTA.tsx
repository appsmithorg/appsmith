import React, { useCallback } from "react";
// import { getTypographyByKey } from "design-system-old";
import { Button, Text } from "design-system";
import type { AppState } from "@appsmith/reducers";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { INTEGRATION_EDITOR_MODES, INTEGRATION_TABS } from "constants/routes";
import history from "utils/history";
import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { WidgetType } from "constants/WidgetConstants";
import { integrationEditorURL } from "RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";

const Container = styled.div`
  height: 75px;
  padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-3);
  margin: var(--ads-v2-spaces-2) var(--ads-v2-spaces-4);
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-3);
  background-color: var(--ads-v2-color-bg-muted);
  border-radius: var(--ads-v2-border-radius);
`;

// const StyledDiv = styled.div`
//   color: ${(props) => props.theme.colors.propertyPane.ctaTextColor};
//   ${getTypographyByKey("p1")}
//   background-color: ${(props) =>
//     props.theme.colors.propertyPane.ctaBackgroundColor};
//   padding: ${(props) => props.theme.spaces[3]}px
//     ${(props) => props.theme.spaces[7]}px;
//   margin: ${(props) => props.theme.spaces[2]}px 0.75rem;

//   button:first-child {
//     margin-top: ${(props) => props.theme.spaces[2]}px;
//     width: 100%;
//   }

//   button:nth-child(2) {
//     margin-top: ${(props) => props.theme.spaces[2]}px;
//   }
// `;

export const actionsExist = (state: AppState): boolean =>
  !!state.entities.actions.length;

type ConnectDataCTAProps = {
  widgetTitle: string;
  widgetId?: string;
  widgetType?: WidgetType;
};

function ConnectDataCTA(props: ConnectDataCTAProps) {
  const dispatch = useDispatch();
  const pageId: string = useSelector(getCurrentPageId);
  const openHelpModal = useCallback(() => {
    dispatch(setGlobalSearchQuery("Connecting to Data Sources"));
    dispatch(toggleShowGlobalSearchModal());
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
      source: "PROPERTY_PANE_CONNECT_DATA",
    });
  }, []);

  const onClick = () => {
    const { widgetId, widgetTitle, widgetType } = props;
    history.push(
      integrationEditorURL({
        pageId,
        selectedTab: INTEGRATION_TABS.NEW,
        params: { mode: INTEGRATION_EDITOR_MODES.AUTO },
      }),
    );
    AnalyticsUtil.logEvent("CONNECT_DATA_CLICK", {
      widgetTitle,
      widgetId,
      widgetType,
    });
  };

  return (
    <Container className="flex flex-col">
      <Text className="t--propertypane-connect-cta" kind="heading-xs">
        Data Required
      </Text>
      <div className="flex gap-3">
        <Button onClick={onClick} tabIndex={0}>
          Connect Data
        </Button>
        <Button kind="secondary" onClick={openHelpModal} tabIndex={0}>
          Learn more
        </Button>
      </div>
    </Container>
  );
}

export default React.memo(ConnectDataCTA);
