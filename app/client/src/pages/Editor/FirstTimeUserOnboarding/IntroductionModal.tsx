import { Icon, Overlay } from "@blueprintjs/core";
import Button, { Category, Size } from "components/ads/Button";
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

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;
const CenteredContainer = styled.div`
  width: 926px;
  background: #fff;
  position: relative;
`;

const ModalHeaderWrapper = styled.div`
  margin: 40px 52px 0px;
`;
const ModalHeader = styled.h5`
  font-size: 28px;
  font-weight: 600;
`;

const ModalSubHeader = styled.h5`
  font-size: 20px;
  margin-top: 20px;
`;

const ModalBody = styled.div`
  margin: 20px 52px 16px;
`;

const ModalContentWrapper = styled.div``;
const ModalContentRow = styled.div<{ border?: boolean }>`
  flex-direction: row;
  display: flex;
  justify-content: space-between;
  height: 113px;
  padding: 20px 0px;
  ${(props) => (props.border ? "border-bottom: 1px solid #E8E8E8;" : "")}
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
  font-size: 36px;
  font-weight: 600;
  color: #716e6e;
`;

const ModalContent = styled.div`
  margin-left: 36px;
`;
const ModalContentHeader = styled.h5`
  font-size: 18px;
  font-weight: 500;
`;
const ModalContentDescription = styled.h5`
  font-size: 16px;
`;

const ModalFooter = styled.div`
  border-top: 1px solid #e8e8e8;
  padding: 0px 56px;
  flex-direction: row;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalFooterText = styled.span`
  font-size: 20px;
  letter-spacing: -0.24px;
`;

const StyledButton = styled(Button)`
  display: inline-block;
`;

const StyledClose = styled(Icon)`
  position: absolute;
  top: 20px;
  right: 20px;
  cursor: pointer;
`;

type IntroductionModalProps = {
  close: () => void;
};

const getConnectDataImg = () => `${ASSETS_CDN_URL}/ConnectData-v2.svg`;
const getDragAndDropImg = () => `${ASSETS_CDN_URL}/DragAndDrop.svg`;
const getPublishAppsImg = () => `${ASSETS_CDN_URL}/PublishApps-v2.svg`;

export default function IntroductionModal({ close }: IntroductionModalProps) {
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
    <Overlay hasBackdrop isOpen transitionDuration={25} usePortal>
      <Wrapper className="t--onboarding-introduction-modal">
        <CenteredContainer>
          <StyledClose
            className="t--how-appsmith-works-modal-close"
            color="#919397"
            icon="cross"
            iconSize={16}
            onClick={onBuildApp}
          />
          <ModalHeaderWrapper className="t--how-appsmith-works-modal-header">
            <ModalHeader>{createMessage(WELCOME_TO_APPSMITH)}</ModalHeader>
            <ModalSubHeader>{createMessage(HOW_APPSMITH_WORKS)}</ModalSubHeader>
          </ModalHeaderWrapper>

          <ModalBody>
            <ModalContentWrapper>
              <ModalContentRow border>
                <ModalContentTextWrapper>
                  <StyledCount>1</StyledCount>
                  <ModalContent>
                    <ModalContentHeader>
                      {createMessage(ONBOARDING_INTRO_CONNECT_YOUR_DATABASE)}
                    </ModalContentHeader>
                    <ModalContentDescription>
                      {createMessage(QUERY_YOUR_DATABASE)}
                    </ModalContentDescription>
                  </ModalContent>
                </ModalContentTextWrapper>
                <StyledImgWrapper>
                  <StyledImg src={getConnectDataImg()} />
                </StyledImgWrapper>
              </ModalContentRow>
              <ModalContentRow border>
                <ModalContentTextWrapper>
                  <StyledCount>2</StyledCount>
                  <ModalContent>
                    <ModalContentHeader>
                      {createMessage(DRAG_AND_DROP)}
                    </ModalContentHeader>
                    <ModalContentDescription>
                      {createMessage(CUSTOMIZE_WIDGET_STYLING)}
                    </ModalContentDescription>
                  </ModalContent>
                </ModalContentTextWrapper>
                <StyledImgWrapper>
                  <StyledImg src={getDragAndDropImg()} />
                </StyledImgWrapper>
              </ModalContentRow>
              <ModalContentRow className="border-b-0">
                <ModalContentTextWrapper>
                  <StyledCount>3</StyledCount>
                  <ModalContent>
                    <ModalContentHeader>
                      {createMessage(ONBOARDING_INTRO_PUBLISH)}
                    </ModalContentHeader>
                    <ModalContentDescription>
                      {createMessage(CHOOSE_ACCESS_CONTROL_ROLES)}
                    </ModalContentDescription>
                  </ModalContent>
                </ModalContentTextWrapper>
                <StyledImgWrapper>
                  <StyledImg src={getPublishAppsImg()} />
                </StyledImgWrapper>
              </ModalContentRow>
            </ModalContentWrapper>
          </ModalBody>
          <ModalFooter>
            <ModalFooterText>
              {createMessage(ONBOARDING_INTRO_FOOTER)}
            </ModalFooterText>
            <div>
              <StyledButton
                category={Category.tertiary}
                className="t--introduction-modal-build-button my-6"
                onClick={onBuildApp}
                size={Size.large}
                tag="button"
                text={createMessage(BUILD_MY_FIRST_APP)}
              />
              <StyledButton
                category={Category.primary}
                className="t--introduction-modal-welcome-tour-button my-6 ml-5"
                onClick={() => triggerWelcomeTour(dispatch)}
                size={Size.large}
                tag="button"
                text={createMessage(START_TUTORIAL)}
              />
            </div>
          </ModalFooter>
        </CenteredContainer>
      </Wrapper>
    </Overlay>
  );
}
