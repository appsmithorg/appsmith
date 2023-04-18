import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "design-system";
import {
  HOW_APPSMITH_WORKS,
  BUILD_MY_FIRST_APP,
  createMessage,
  WELCOME_TO_APPSMITH,
  ONBOARDING_INTRO_CONNECT_YOUR_DATABASE,
  QUERY_YOUR_DATABASE,
  DRAG_AND_DROP,
  CUSTOMIZE_WIDGET_STYLING,
  ONBOARDING_INTRO_PUBLISH,
  CHOOSE_ACCESS_CONTROL_ROLES,
  ONBOARDING_INTRO_FOOTER,
  START_TUTORIAL,
} from "@appsmith/constants/messages";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import React from "react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { triggerWelcomeTour } from "./Utils";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

const ModalSubHeader = styled.h5`
  font-size: 14px;
  margin-top: 20px;
`;

const ModalContentWrapper = styled.div``;
const ModalContentRow = styled.div<{ border?: boolean }>`
  flex-direction: row;
  display: flex;
  justify-content: space-between;
  height: 113px;
  padding: 20px 0px;
  ${(props) =>
    props.border ? "border-bottom: 1px solid var(--ads-v2-color-border);" : ""}
`;
const ModalContentTextWrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 3;
`;

const StyledImgWrapper = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
`;

const StyledImg = styled.img`
  vertical-align: middle;
`;

const StyledCount = styled.h5`
  font-size: 30px;
  font-weight: 600;
  color: var(--ads-v2-color-fg-emphasi);
`;

const ModalContentItem = styled.div`
  margin-left: 36px;
`;
const ModalContentHeader = styled.h5`
  font-size: 16px;
  font-weight: 500;
`;
const ModalContentDescription = styled.h5`
  font-size: 14px;
`;

const ModalFooterText = styled.span`
  font-size: 14px;
  letter-spacing: -0.24px;
`;

type IntroductionModalProps = {
  close: () => void;
};

const getConnectDataImg = () => `${ASSETS_CDN_URL}/ConnectData-v2.svg`;
const getDragAndDropImg = () => `${ASSETS_CDN_URL}/DragAndDrop.svg`;
const getPublishAppsImg = () => `${ASSETS_CDN_URL}/PublishApps-v2.svg`;

export default function IntroductionModal({ close }: IntroductionModalProps) {
  const modalAlwaysOpen = true;
  const dispatch = useDispatch();
  const onBuildApp = () => {
    AnalyticsUtil.logEvent("SIGNPOSTING_BUILD_APP_CLICK");
    close();
  };
  useEffect(() => {
    dispatch({
      type: ReduxActionTypes.GET_ALL_APPLICATION_INIT,
    });
  }, []);
  return (
    <Modal onOpenChange={onBuildApp} open={modalAlwaysOpen}>
      <ModalContent>
        <ModalHeader className="t--how-appsmith-works-modal-header">
          {createMessage(WELCOME_TO_APPSMITH)}
        </ModalHeader>
        <ModalBody>
          <ModalSubHeader>{createMessage(HOW_APPSMITH_WORKS)}</ModalSubHeader>
          <ModalContentWrapper>
            <ModalContentRow border>
              <ModalContentTextWrapper>
                <StyledCount>1</StyledCount>
                <ModalContentItem>
                  <ModalContentHeader>
                    {createMessage(ONBOARDING_INTRO_CONNECT_YOUR_DATABASE)}
                  </ModalContentHeader>
                  <ModalContentDescription>
                    {createMessage(QUERY_YOUR_DATABASE)}
                  </ModalContentDescription>
                </ModalContentItem>
              </ModalContentTextWrapper>
              <StyledImgWrapper>
                <StyledImg
                  alt="connect-data-image"
                  src={getAssetUrl(getConnectDataImg())}
                />
              </StyledImgWrapper>
            </ModalContentRow>
            <ModalContentRow border>
              <ModalContentTextWrapper>
                <StyledCount>2</StyledCount>
                <ModalContentItem>
                  <ModalContentHeader>
                    {createMessage(DRAG_AND_DROP)}
                  </ModalContentHeader>
                  <ModalContentDescription>
                    {createMessage(CUSTOMIZE_WIDGET_STYLING)}
                  </ModalContentDescription>
                </ModalContentItem>
              </ModalContentTextWrapper>
              <StyledImgWrapper>
                <StyledImg
                  alt="drag-and-drop-img"
                  src={getAssetUrl(getDragAndDropImg())}
                />
              </StyledImgWrapper>
            </ModalContentRow>
            <ModalContentRow className="border-b-0">
              <ModalContentTextWrapper>
                <StyledCount>3</StyledCount>
                <ModalContentItem>
                  <ModalContentHeader>
                    {createMessage(ONBOARDING_INTRO_PUBLISH)}
                  </ModalContentHeader>
                  <ModalContentDescription>
                    {createMessage(CHOOSE_ACCESS_CONTROL_ROLES)}
                  </ModalContentDescription>
                </ModalContentItem>
              </ModalContentTextWrapper>
              <StyledImgWrapper>
                <StyledImg
                  alt="publish-image"
                  src={getAssetUrl(getPublishAppsImg())}
                />
              </StyledImgWrapper>
            </ModalContentRow>
          </ModalContentWrapper>
          <ModalFooterText>
            {createMessage(ONBOARDING_INTRO_FOOTER)}
          </ModalFooterText>
        </ModalBody>
        <ModalFooter>
          <Button
            className="t--introduction-modal-welcome-tour-button"
            kind="secondary"
            onClick={() => triggerWelcomeTour(dispatch)}
            size="md"
          >
            {createMessage(START_TUTORIAL)}
          </Button>
          <Button
            className="t--introduction-modal-build-button"
            onClick={onBuildApp}
            size="md"
          >
            {createMessage(BUILD_MY_FIRST_APP)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
