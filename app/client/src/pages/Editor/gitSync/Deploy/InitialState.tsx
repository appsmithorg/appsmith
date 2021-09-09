import React from "react";
import {
  Subtitle,
  Title,
} from "pages/Editor/gitSync/components/StyledComponents";
import {
  createMessage,
  CONNECT_TO_GIT_REPOSITORY,
  CONNECT_TO_GIT_REPOSITORY_SUBTITLE,
  CONNECT,
  DEPLOY_WITHOUT_GIT,
  DEPLOY_TO_CLOUD,
} from "constants/messages";
import styled from "styled-components";
import Button, { Category, Size } from "components/ads/Button";
import { useDispatch, useSelector } from "react-redux";

import { publishApplication } from "actions/applicationActions";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getCurrentApplication } from "selectors/applicationSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-item: flex-start;
  height: 100%;
`;

const GitSection = styled.div`
  flex: 1;
`;

const Separator = styled.div`
  height: 1px;
  width: 85%;
  background-color: ${(props) => props.theme.colors.gitSyncModal.separator};
`;

export default function InitialState() {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const currentApplication = useSelector(getCurrentApplication);
  const handlePublish = () => {
    if (applicationId) {
      dispatch(publishApplication(applicationId));

      const appName = currentApplication ? currentApplication.name : "";
      AnalyticsUtil.logEvent("PUBLISH_APP", {
        appId: applicationId,
        appName,
      });
    }
  };

  return (
    <Container>
      <GitSection>
        <Title>{createMessage(CONNECT_TO_GIT_REPOSITORY)}</Title>
        <Subtitle>{createMessage(CONNECT_TO_GIT_REPOSITORY_SUBTITLE)}</Subtitle>
        <Button
          size={Size.medium}
          text={createMessage(CONNECT)}
          width="max-content"
        />
      </GitSection>
      <div>
        <Separator />
        <Title>{createMessage(DEPLOY_TO_CLOUD)}</Title>
        <Subtitle>{createMessage(DEPLOY_WITHOUT_GIT)}</Subtitle>
        <Button
          category={Category.tertiary}
          onClick={handlePublish}
          size={Size.medium}
          text={createMessage(CONNECT)}
          width="max-content"
        />
      </div>
    </Container>
  );
}
