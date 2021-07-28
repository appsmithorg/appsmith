import Button, { Category, Size } from "components/ads/Button";
import React, { useCallback } from "react";
import { AppState } from "reducers";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  INTEGRATION_EDITOR_MODES,
  INTEGRATION_EDITOR_URL,
  INTEGRATION_TABS,
} from "constants/routes";
import history from "utils/history";
import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getTypographyByKey } from "constants/DefaultTheme";
import { WidgetTypes } from "constants/WidgetConstants";

const StyledDiv = styled.div`
  color: ${(props) => props.theme.colors.propertyPane.ctaTextColor};
  ${(props) => getTypographyByKey(props, "p1")}
  background-color: ${(props) =>
    props.theme.colors.propertyPane.ctaBackgroundColor};
  padding: ${(props) => props.theme.spaces[3]}px ${(props) =>
  props.theme.spaces[7]}px;
  margin: ${(props) => props.theme.spaces[2]}px 0px;

  a:first-child {
    margin-top: ${(props) => props.theme.spaces[2]}px;
  }
  a:nth-child(2) {
    border: none;
    background-color: transparent;
    text-transform: none;
    justify-content: flex-start;
    padding: 0px;
    color: ${(props) => props.theme.colors.propertyPane.ctaLearnMoreTextColor};
    ${(props) => getTypographyByKey(props, "p3")}
    margin-top: ${(props) => props.theme.spaces[2]}px;

    :hover {
      text-decoration: underline;
    }
  }
`;

// Widgets where we do not want to show the CTA
export const excludeList = [
  WidgetTypes.CONTAINER_WIDGET,
  WidgetTypes.TABS_WIDGET,
  WidgetTypes.FORM_WIDGET,
  WidgetTypes.MODAL_WIDGET,
  WidgetTypes.DIVIDER_WIDGET,
  WidgetTypes.FILE_PICKER_WIDGET,
  WidgetTypes.BUTTON_WIDGET,
];

export const actionsExist = (state: AppState): boolean =>
  !!state.entities.actions.length;

function ConnectDataCTA() {
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();

  const openHelpModal = useCallback(() => {
    dispatch(setGlobalSearchQuery("Connecting to Data Sources"));
    dispatch(toggleShowGlobalSearchModal());
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
      source: "PROPERTY_PANE_CONNECT_DATA",
    });
  }, []);

  const onClick = () => {
    history.push(
      INTEGRATION_EDITOR_URL(
        applicationId,
        pageId,
        INTEGRATION_TABS.NEW,
        INTEGRATION_EDITOR_MODES.MOCK,
      ),
    );
    AnalyticsUtil.logEvent("CONNECT_DATA_CLICK");
  };

  return (
    <StyledDiv className="t--propertypane-connect-cta">
      Data Required
      <Button
        category={Category.primary}
        onClick={onClick}
        size={Size.large}
        text="CONNECT DATA"
      />
      <Button
        category={Category.tertiary}
        onClick={openHelpModal}
        text="Learn more"
      />
    </StyledDiv>
  );
}

export default ConnectDataCTA;
