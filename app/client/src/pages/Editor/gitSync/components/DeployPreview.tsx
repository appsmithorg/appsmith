import React from "react";

import styled from "styled-components";
import { ReactComponent as CloudyIcon } from "assets/icons/ads/cloudy-line.svg";
import { ReactComponent as RightArrow } from "assets/icons/ads/arrow-right-line.svg";
import { useSelector } from "react-redux";
import {
  getCurrentPageId,
  getApplicationLastDeployedAt,
} from "selectors/editorSelectors";
import {
  createMessage,
  LATEST_DP_SUBTITLE,
  LATEST_DP_TITLE,
} from "@appsmith/constants/messages";
import SuccessTick from "pages/common/SuccessTick";
import { howMuchTimeBeforeText } from "utils/helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { viewerURL } from "RouteBuilder";
import { Text } from "design-system";

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  gap: ${(props) => props.theme.spaces[6]}px;
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
      fill: var(--ads-v2-color-black-750);
    }
  }
`;

export default function DeployPreview(props: { showSuccess: boolean }) {
  const pageId = useSelector(getCurrentPageId) as string;
  const lastDeployedAt = useSelector(getApplicationLastDeployedAt);

  const showDeployPreview = () => {
    AnalyticsUtil.logEvent("GS_LAST_DEPLOYED_PREVIEW_LINK_CLICK", {
      source: "GIT_DEPLOY_MODAL",
    });
    const path = viewerURL({
      pageId,
    });
    window.open(path, "_blank");
  };

  const lastDeployedAtMsg = lastDeployedAt
    ? `${createMessage(LATEST_DP_SUBTITLE)} ${howMuchTimeBeforeText(
        lastDeployedAt,
        {
          lessThanAMinute: true,
        },
      )} ago`
    : "";
  return lastDeployedAt ? (
    <Container className="t--git-deploy-preview">
      <div>
        {props.showSuccess ? (
          <SuccessTick height="30px" width="30px" />
        ) : (
          <CloudyIcon />
        )}
      </div>
      <div>
        <ButtonWrapper onClick={showDeployPreview}>
          <Text color="var(--ads-v2-color-fg-emphasis)" kind="heading-s">
            {createMessage(LATEST_DP_TITLE)}
          </Text>
          <IconWrapper>
            <RightArrow width={20} />
          </IconWrapper>
        </ButtonWrapper>
        <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
          {lastDeployedAtMsg}
        </Text>
      </div>
    </Container>
  ) : null;
}
