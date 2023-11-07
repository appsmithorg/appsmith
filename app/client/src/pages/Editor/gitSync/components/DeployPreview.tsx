import React from "react";

import styled from "styled-components";
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
import { viewerURL } from "@appsmith/RouteBuilder";
import { Link, Text } from "design-system";
import { importSvg } from "design-system-old";

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
