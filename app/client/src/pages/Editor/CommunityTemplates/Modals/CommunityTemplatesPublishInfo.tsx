import {
  COMMUNITY_TEMPLATES,
  LEARN_MORE,
  createMessage,
} from "ee/constants/messages";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { Button, Icon, Text } from "@appsmith/ads";
import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { COMMUNITY_PORTAL } from "constants/TemplatesConstants";

interface Props {
  onPublishClick: () => void;
  setShowHostModal: (showModal: boolean) => void;
}
const CommunityTemplatesPublishInfo = ({
  onPublishClick,
  setShowHostModal,
}: Props) => {
  const currentApplication = useSelector(getCurrentApplication);
  const takeUserToPublishFormPage = () => {
    setShowHostModal(false);
    onPublishClick();
  };
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({
      type: ReduxActionTypes.SET_PUBLISHED_APP_TO_COMMUNITY_PORTAL,
    });
  }, []);

  return currentApplication?.isCommunityTemplate ? (
    <PublishedAppInstructions />
  ) : (
    <UnPublishedAppInstructions
      takeUserToPublishFormPage={takeUserToPublishFormPage}
    />
  );
};

export default CommunityTemplatesPublishInfo;

const PublishedAppInstructions = () => {
  const currentApplication = useSelector(getCurrentApplication);
  const onVisitTemplateClick = useCallback(() => {
    openUrlInNewPage(
      `${COMMUNITY_PORTAL.BASE_URL}/template/${currentApplication?.id}`,
    );
  }, [currentApplication?.id]);

  return (
    <>
      <InfoContainer>
        <VerticalCenterContainer>
          <Icon
            color="var(--ads-v2-color-fg-success)"
            name="oval-check"
            size="lg"
          />
          <Text kind="heading-s" renderAs="h2">
            {createMessage(COMMUNITY_TEMPLATES.modals.publishedInfo.title)}
          </Text>
        </VerticalCenterContainer>
        <Text kind="body-m" renderAs="p">
          {createMessage(COMMUNITY_TEMPLATES.modals.publishedInfo.description)}
        </Text>
      </InfoContainer>
      <InfoFooter>
        <Button endIcon="link" onClick={onVisitTemplateClick} size="md">
          {createMessage(COMMUNITY_TEMPLATES.modals.publishedInfo.viewTemplate)}
        </Button>
      </InfoFooter>
    </>
  );
};

const UnPublishedAppInstructions = ({
  takeUserToPublishFormPage,
}: {
  takeUserToPublishFormPage: () => void;
}) => {
  return (
    <>
      <InfoContainer>
        <Text kind="heading-s" renderAs="h2">
          {createMessage(COMMUNITY_TEMPLATES.modals.unpublishedInfo.title)}
        </Text>
        <Text kind="body-m" renderAs="p">
          {createMessage(
            COMMUNITY_TEMPLATES.modals.unpublishedInfo.description,
          )}
        </Text>
      </InfoContainer>
      <InfoFooter>
        <Button
          endIcon="link"
          href={`${COMMUNITY_PORTAL.BASE_URL}/library/guide`}
          kind="tertiary"
          renderAs="a"
          size="md"
          target="_blank"
        >
          {createMessage(LEARN_MORE)}
        </Button>
        <Button
          data-testid="t--Publish-Initiate"
          onClick={takeUserToPublishFormPage}
          size="md"
        >
          {createMessage(COMMUNITY_TEMPLATES.modals.unpublishedInfo.publishBtn)}
        </Button>
      </InfoFooter>
    </>
  );
};

let windowReference: Window | null = null;

function openUrlInNewPage(url: string) {
  // If the tab is opened focus and reload else open in new tab
  if (!windowReference || windowReference.closed) {
    windowReference = window.open(url, "_blank");
  } else {
    windowReference.focus();
    windowReference.location.href = windowReference.location.origin + url;
  }
}

const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 75px;
  padding-top: var(--ads-v2-spaces-2);
`;
const InfoFooter = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  align-items: center;
`;
const VerticalCenterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
