import React from "react";
import {
  Subtitle,
  Title,
} from "pages/Editor/gitSync/components/StyledComponents";
import styled from "styled-components";
import Button, { Category, Size } from "components/ads/Button";

import { getCurrentApplicationId } from "selectors/editorSelectors";
// import AnalyticsUtil from "utils/AnalyticsUtil";
import { getApplicationViewerPageURL } from "constants/routes";
import { useSelector } from "store";
import { getCurrentPageId } from "selectors/editorSelectors";
import {
  CHECK_DP,
  LATEST_DP_TITLE,
  LATEST_DP_SUBTITLE,
  createMessage,
} from "constants/messages";

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;

  justify-content: flex-end;
  /* bottom: ${(props) => `${props.theme.spaces[8]}px`}; */
  bottom: 30px;
  width: calc(100% - 30px);
  position: absolute;
`;

const Separator = styled.div`
  height: 1px;
  width: 85%;
  background-color: ${(props) => props.theme.colors.gitSyncModal.separator};
`;

export default function DeployPreview() {
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  const showDeployPreview = () => {
    const path = getApplicationViewerPageURL(applicationId, pageId);
    window.open(path, "_blank");
  };

  return (
    <Container>
      <Separator />
      <Title>{createMessage(LATEST_DP_TITLE)}</Title>
      <Subtitle>{createMessage(LATEST_DP_SUBTITLE)}</Subtitle>
      <Button
        category={Category.tertiary}
        onClick={showDeployPreview}
        size={Size.medium}
        text={createMessage(CHECK_DP)}
        width="max-content"
      />
    </Container>
  );
}
