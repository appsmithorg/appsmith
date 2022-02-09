import React from "react";

import styled from "styled-components";
import { ReactComponent as CloudyIcon } from "assets/icons/ads/cloudy-line.svg";
import { ReactComponent as RightArrow } from "assets/icons/ads/arrow-right-line.svg";

// import AnalyticsUtil from "utils/AnalyticsUtil";
import { getApplicationViewerPageURL } from "constants/routes";
import { useSelector } from "store";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  LATEST_DP_TITLE,
  LATEST_DP_SUBTITLE,
  createMessage,
} from "@appsmith/constants/messages";
import Text, { TextType, Case } from "components/ads/Text";
import { Colors } from "constants/Colors";
import SuccessTick from "pages/common/SuccessTick";
import { howMuchTimeBeforeText } from "utils/helpers";
import { getApplicationLastDeployedAt } from "selectors/editorSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  width: calc(100% - 30px);
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding-top: 2px;
  cursor: pointer;
  :hover {
    text-decoration: underline;
  }
`;

const IconWrapper = styled.div`
  margin-left: 2px;
  justify-content: center;
  align-items: center;
  display: flex;
  svg {
    path {
      fill: ${Colors.GREY_9};
    }
  }
`;

const ContentWrapper = styled.div`
  margin-left: ${(props) => props.theme.spaces[6]}px;
`;

const CloudIconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default function DeployPreview(props: { showSuccess: boolean }) {
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  const lastDeployedAt = useSelector(getApplicationLastDeployedAt);

  const showDeployPreview = () => {
    AnalyticsUtil.logEvent("GS_LAST_DEPLOYED_PREVIEW_LINK_CLICK", {
      source: "GIT_DEPLOY_MODAL",
    });
    const path = getApplicationViewerPageURL({ applicationId, pageId });
    window.open(path, "_blank");
  };

  const lastDeployedAtMsg = lastDeployedAt
    ? `${createMessage(LATEST_DP_SUBTITLE)} ${howMuchTimeBeforeText(
        lastDeployedAt,
      )} ago`
    : "";
  return lastDeployedAt ? (
    <Container>
      <CloudIconWrapper>
        {props.showSuccess ? (
          <SuccessTick height="30px" width="30px" />
        ) : (
          <CloudyIcon />
        )}
      </CloudIconWrapper>
      <ContentWrapper>
        <ButtonWrapper onClick={showDeployPreview}>
          <Text
            case={Case.UPPERCASE}
            color={Colors.GREY_9}
            type={TextType.P1}
            weight="600"
          >
            {createMessage(LATEST_DP_TITLE)}
          </Text>
          <IconWrapper>
            <RightArrow width={20} />
          </IconWrapper>
        </ButtonWrapper>
        <Text color={Colors.GREY_6} type={TextType.P3}>
          {lastDeployedAtMsg}
        </Text>
      </ContentWrapper>
    </Container>
  ) : null;
}
