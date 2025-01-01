import React from "react";

import styled from "styled-components";
import { useSelector } from "react-redux";
import {
  getApplicationLastDeployedAt,
  getCurrentBasePageId,
} from "selectors/editorSelectors";
import {
  createMessage,
  LATEST_DP_SUBTITLE,
  LATEST_DP_TITLE,
} from "ee/constants/messages";
import SuccessTick from "pages/common/SuccessTick";
import { howMuchTimeBeforeText } from "utils/helpers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { viewerURL } from "ee/RouteBuilder";
import { Link, Text } from "@appsmith/ads";
import { importSvg } from "@appsmith/ads-old";

const CloudyIcon = importSvg(
  async () => import("assets/icons/ads/cloudy-line.svg"),
);

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  gap: ${(props) => props.theme.spaces[6]}px;

  .cloud-icon {
    stroke: var(--ads-v2-color-fg);
  }
`;

export default function DeployPreview() {
  // ! case: should reset after timer
  const showSuccess = false;

  const basePageId = useSelector(getCurrentBasePageId);
  const lastDeployedAt = useSelector(getApplicationLastDeployedAt);

  const showDeployPreview = () => {
    AnalyticsUtil.logEvent("GS_LAST_DEPLOYED_PREVIEW_LINK_CLICK", {
      source: "GIT_DEPLOY_MODAL",
    });
    const path = viewerURL({
      basePageId,
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
        {showSuccess ? (
          <SuccessTick height="30px" width="30px" />
        ) : (
          <CloudyIcon className="cloud-icon" />
        )}
      </div>
      <div>
        <Link endIcon="right-arrow" onClick={showDeployPreview}>
          {createMessage(LATEST_DP_TITLE)}
        </Link>
        <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
          {lastDeployedAtMsg}
        </Text>
      </div>
    </Container>
  ) : null;
}
