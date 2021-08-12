import { Icon, Overlay } from "@blueprintjs/core";
import Button, { Category } from "components/ads/Button";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";

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

export default function IntroductionModal({ close }: IntroductionModalProps) {
  const dispatch = useDispatch();
  const onBuildApp = () => {
    AnalyticsUtil.logEvent("SIGNPOSTING_BUILD_APP_CLICK");
    close();
  };
  return (
    <Overlay hasBackdrop isOpen transitionDuration={25} usePortal>
      <Wrapper>
        <CenteredContainer>
          <StyledClose
            color="#919397"
            icon="cross"
            iconSize={16}
            onClick={onBuildApp}
          />
          <ModalHeader>Here’s how Appsmith works</ModalHeader>
          <ModalBody>
            <ModalImgWrapper>
              <StyledImgWrapper>
                <StyledImg
                  src="https://assets.appsmith.com/ConnectData.png"
                  width="135"
                />
                <StyledImg
                  src="https://assets.appsmith.com/Arrow.png"
                  width="42"
                />
              </StyledImgWrapper>
              <StyledImgWrapper>
                <StyledImg
                  src="https://assets.appsmith.com/QueryData.png"
                  width="330"
                />
              </StyledImgWrapper>
              <StyledImgWrapper>
                <StyledImg
                  src="https://assets.appsmith.com/Arrow.png"
                  width="42"
                />
                <StyledImg
                  src="https://assets.appsmith.com/PublishApps.png"
                  width="92"
                />
              </StyledImgWrapper>
            </ModalImgWrapper>
            <ModalContentWrapper>
              <div>
                <StyledCount>1.</StyledCount>
                <ModalContent>Connect your database or API</ModalContent>
              </div>
              <div>
                <StyledCount>2.</StyledCount>
                <ModalContent>
                  Connect queried data to pre-built widgets and customise with
                  Javascript.
                </ModalContent>
              </div>
              <div>
                <StyledCount>3.</StyledCount>
                <ModalContent>
                  Instantly publish and share your apps
                </ModalContent>
              </div>
            </ModalContentWrapper>
          </ModalBody>
          <ModalFooter>
            <StyledButton
              category={Category.primary}
              onClick={onBuildApp}
              tag="button"
              text="Build my first app"
            />
            <ModalFooterNote>
              Want more help getting started, let’s&nbsp;
              <span
                onClick={() => {
                  AnalyticsUtil.logEvent("SIGNPOSTING_WELCOME_TOUR_CLICK");
                  dispatch({
                    type:
                      ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_EXPERIENCE,
                    payload: false,
                  });
                  dispatch({
                    type:
                      ReduxActionTypes.SET_FIRST_TIME_USER_EXPERIENCE_APPLICATION_ID,
                    payload: "",
                  });
                  dispatch({
                    type: ReduxActionTypes.ONBOARDING_CREATE_APPLICATION,
                  });
                }}
              >
                build an app together.
              </span>
            </ModalFooterNote>
          </ModalFooter>
        </CenteredContainer>
      </Wrapper>
    </Overlay>
  );
}
