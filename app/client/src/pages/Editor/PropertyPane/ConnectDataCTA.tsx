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

const StyledDiv = styled.div`
  color: #202223;
  font-size: 15px;
  background-color: rgb(248, 106, 43, 0.1);
  padding: 8px 17px;
  margin: 6px 0px;

  a:first-child {
    margin-top: 6px;
  }
  a:nth-child(2) {
    border: none;
    background-color: transparent;
    text-transform: none;
    justify-content: flex-start;
    padding: 0px;
    color: #f86a2b;
    font-size: 12px;
    margin-top: 6px;

    :hover {
      text-decoration: underline;
    }
  }
`;

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

  return (
    <StyledDiv>
      Data Required
      <Button
        category={Category.primary}
        onClick={() =>
          history.push(
            INTEGRATION_EDITOR_URL(
              applicationId,
              pageId,
              INTEGRATION_TABS.NEW,
              INTEGRATION_EDITOR_MODES.MOCK,
            ),
          )
        }
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
