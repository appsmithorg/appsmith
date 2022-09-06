import React, { useCallback } from "react";
import { Button, Category, Size } from "design-system";
import { AppState } from "@appsmith/reducers";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { INTEGRATION_EDITOR_MODES, INTEGRATION_TABS } from "constants/routes";
import history from "utils/history";
import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getTypographyByKey } from "constants/DefaultTheme";
import { WidgetType } from "constants/WidgetConstants";
import { integrationEditorURL } from "RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";

const StyledDiv = styled.div`
  color: ${(props) => props.theme.colors.propertyPane.ctaTextColor};
  ${(props) => getTypographyByKey(props, "p1")}
  background-color: ${(props) =>
    props.theme.colors.propertyPane.ctaBackgroundColor};
  padding: ${(props) => props.theme.spaces[3]}px ${(props) =>
  props.theme.spaces[7]}px;
  margin: ${(props) => props.theme.spaces[2]}px 0.75rem;

  button:first-child {
    margin-top: ${(props) => props.theme.spaces[2]}px;
    width: 100%;
  }
  button:nth-child(2) {
    border: none;
    background-color: transparent;
    text-transform: none;
    justify-content: flex-start;
    padding: 0px;
    color: ${(props) => props.theme.colors.propertyPane.ctaLearnMoreTextColor};
    ${(props) => getTypographyByKey(props, "p3")}
    margin-top: ${(props) => props.theme.spaces[2]}px;

    :hover, :focus {
      text-decoration: underline;
    }
  }
`;

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
    <StyledDiv className="t--propertypane-connect-cta">
      Data Required
      <Button
        category={Category.primary}
        onClick={onClick}
        size={Size.large}
        tabIndex={0}
        tag="button"
        text="CONNECT DATA"
      />
      <Button
        category={Category.tertiary}
        onClick={openHelpModal}
        tabIndex={0}
        tag="button"
        text="Learn more"
      />
    </StyledDiv>
  );
}

export default React.memo(ConnectDataCTA);
