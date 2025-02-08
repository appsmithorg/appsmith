import React, { useCallback, useEffect, useState } from "react";

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
import { Icon, Link, Text } from "@appsmith/ads";

const StyledIcon = styled(Icon)`
  svg {
    width: 30px;
    height: 30px;
  }
`;

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  gap: ${(props) => props.theme.spaces[6]}px;
`;

interface DeployPreviewProps {
  isCommitSuccess: boolean;
}

export default function DeployPreview({ isCommitSuccess }: DeployPreviewProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(
    function startTimerForCommitSuccessEffect() {
      if (isCommitSuccess) {
        setShowSuccess(true);
        const timer = setTimeout(() => {
          setShowSuccess(false);
        }, 5000);

        return () => clearTimeout(timer);
      }
    },
    [isCommitSuccess],
  );

  const basePageId = useSelector(getCurrentBasePageId);
  const lastDeployedAt = useSelector(getApplicationLastDeployedAt);

  const showDeployPreview = useCallback(() => {
    AnalyticsUtil.logEvent("GS_LAST_DEPLOYED_PREVIEW_LINK_CLICK", {
      source: "GIT_DEPLOY_MODAL",
    });
    const path = viewerURL({
      basePageId,
    });

    window.open(path, "_blank");
  }, [basePageId]);

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
          <StyledIcon color="var(--ads-v2-color-fg)" name="cloud-v2" />
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
