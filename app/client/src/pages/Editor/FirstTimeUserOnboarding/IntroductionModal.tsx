import { Icon, Overlay } from "@blueprintjs/core";
import Button, { Category } from "components/ads/Button";
import {
  ONBOARDING_INTRO_CONNECT_DATA_WIDGET,
  ONBOARDING_INTRO_CONNECT_YOUR_DATABASE,
  HOW_APPSMITH_WORKS,
  ONBOARDING_INTRO_PUBLISH,
  BUILD_MY_FIRST_APP,
  ONBOARDING_INTRO_FOOTER,
  BUILD_APP_TOGETHER,
  createMessage,
} from "constants/messages";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import React from "react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { triggerWelcomeTour } from "./Utils";

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;
const CenteredContainer = styled.div`
  width: 783px;
  height: 420px;
  background: #fff;
  padding: 16px 24px;
  position: relative;
`;

const ModalHeader = styled.h5`
  font-size: 20px;
  margin: 16px 0 6px;
  text-align: center;
`;

const ModalBody = styled.div`
  text-align: center;
`;

const ModalImgWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const ModalContentWrapper = styled.div`
  display: flex;
  & div:nth-child(1) {
    flex-basis: 165px;
  }
  & div:nth-child(2) {
    flex-basis: 265px;
    margin-left: 73px;
  }
  & div:nth-child(3) {
    flex-basis: 135px;
    margin-left: 72px;
  }
`;

const StyledImgWrapper = styled.div`
  text-align: center;
  &:nth-child(1) {
    width: 25%;
    position: relative;
    right: -2px;
  }
  &:nth-child(2) {
    padding-top: 28px;
    width: 50%;
  }
  &:nth-child(3) {
    padding-top: 22px;
    width: 25%;
    position: relative;
    left: -24px;
  }
`;

const StyledImg = styled.img`
  width: ${(props) => props.width}px;
  vertical-align: middle;
`;

const StyledCount = styled.h5`
  font-size: 20px;
  margin: 0 0 5px;
  font-weight: 500;
`;

const ModalContent = styled.p``;

const ModalFooter = styled.div`
  text-align: center;
`;

const StyledButton = styled(Button)`
  width: 145px;
  height: 38px;
  display: inline-block;
  margin: 33px 0px 30px;
`;

const ModalFooterNote = styled.p`
  & span {
    cursor: pointer;
    color: ${(props) => props.theme.colors.welcomeTourStickySidebarBackground};
  }
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

const getConnectDataImg = () => `${ASSETS_CDN_URL}/ConnectData.svg`;
const getArrowImg = () => `${ASSETS_CDN_URL}/Arrow.svg`;
const getQueryDataImg = () => `${ASSETS_CDN_URL}/QueryData.svg`;
const getPublishAppsImg = () => `${ASSETS_CDN_URL}/PublishApps.svg`;

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
      <Wrapper>
        <CenteredContainer>
          <StyledClose
            className="t--how-appsmith-works-modal-close"
            color="#919397"
            icon="cross"
            iconSize={16}
            onClick={onBuildApp}
          />
          <ModalHeader className="t--how-appsmith-works-modal-header">
            {createMessage(HOW_APPSMITH_WORKS)}
          </ModalHeader>
          <ModalBody>
            <ModalImgWrapper>
              <StyledImgWrapper>
                <StyledImg src={getConnectDataImg()} width="135" />
                <StyledImg src={getArrowImg()} width="42" />
              </StyledImgWrapper>
              <StyledImgWrapper>
                <StyledImg src={getQueryDataImg()} width="330" />
              </StyledImgWrapper>
              <StyledImgWrapper>
                <StyledImg src={getArrowImg()} width="42" />
                <StyledImg src={getPublishAppsImg()} width="92" />
              </StyledImgWrapper>
            </ModalImgWrapper>
            <ModalContentWrapper>
              <div>
                <StyledCount>1.</StyledCount>
                <ModalContent>
                  {createMessage(ONBOARDING_INTRO_CONNECT_YOUR_DATABASE)}
                </ModalContent>
              </div>
              <div>
                <StyledCount>2.</StyledCount>
                <ModalContent>
                  {createMessage(ONBOARDING_INTRO_CONNECT_DATA_WIDGET)}
                </ModalContent>
              </div>
              <div>
                <StyledCount>3.</StyledCount>
                <ModalContent>
                  {createMessage(ONBOARDING_INTRO_PUBLISH)}
                </ModalContent>
              </div>
            </ModalContentWrapper>
          </ModalBody>
          <ModalFooter>
            <StyledButton
              category={Category.primary}
              onClick={onBuildApp}
              tag="button"
              text={createMessage(BUILD_MY_FIRST_APP)}
            />
            <ModalFooterNote>
              {createMessage(ONBOARDING_INTRO_FOOTER)}&nbsp;
              <span onClick={() => triggerWelcomeTour(dispatch)}>
                {createMessage(BUILD_APP_TOGETHER)}
              </span>
            </ModalFooterNote>
          </ModalFooter>
        </CenteredContainer>
      </Wrapper>
    </Overlay>
  );
}
