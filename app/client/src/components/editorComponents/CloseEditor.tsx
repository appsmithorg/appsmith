import React from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";
import { Icon } from "@blueprintjs/core";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import {
  BUILDER_PAGE_URL,
  INTEGRATION_EDITOR_URL,
  INTEGRATION_TABS,
  getGenerateTemplateFormURL,
} from "../../constants/routes";
import { useSelector } from "react-redux";
import { getQueryParams } from "../../utils/AppsmithUtils";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "../../selectors/editorSelectors";

const IconContainer = styled.div`
  //width: 100%;
  height: 30px;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-left: 16px;
  width: fit-content;
  /* background-color: ${(props) => props.theme.colors.apiPane.iconHoverBg}; */
`;

function CloseEditor() {
  const history = useHistory();
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  const params: string = location.search;

  const searchParamsInstance = new URLSearchParams(params);
  const redirectTo = searchParamsInstance.get("from");

  const isGeneratePageInitiator = getIsGeneratePageInitiator();
  let integrationTab = INTEGRATION_TABS.ACTIVE;

  if (isGeneratePageInitiator) {
    // When users routes to Integrations page via generate CRUD page form
    // the INTEGRATION_TABS.ACTIVE is hidden and
    // hence when routing back, user should go back to INTEGRATION_TABS.NEW tab.
    integrationTab = INTEGRATION_TABS.NEW;
  }
  // if it is a generate CRUD page flow from which user came here
  // then route user back to `/generate-page/form`
  // else go back to BUILDER_PAGE
  const redirectURL = isGeneratePageInitiator
    ? getGenerateTemplateFormURL(applicationId, pageId)
    : BUILDER_PAGE_URL({
        applicationId,
        pageId,
      });

  const handleClose = (e: React.MouseEvent) => {
    PerformanceTracker.startTracking(
      PerformanceTransactionName.CLOSE_SIDE_PANE,
      { path: location.pathname },
    );
    e.stopPropagation();

    const URL =
      redirectTo === "datasources"
        ? INTEGRATION_EDITOR_URL(
            applicationId,
            pageId,
            integrationTab,
            "",
            getQueryParams(),
          )
        : redirectURL;
    history.push(URL);
  };

  return (
    <IconContainer onClick={handleClose}>
      <Icon icon="chevron-left" iconSize={16} />
      <Text style={{ color: "#0c0000", lineHeight: "14px" }} type={TextType.P1}>
        Back
      </Text>
    </IconContainer>
  );
}

export default CloseEditor;
