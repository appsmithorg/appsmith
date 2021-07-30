import React, { memo } from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  width: 100%;
`;

const ImgWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const ContentWrapper = styled.div`
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

const ImgContainer = styled.div`
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

export default memo(function HowAppsmithWorks() {
  return (
    <Wrapper>
      <ImgWrapper>
        <ImgContainer>
          <StyledImg
            src="https://assets.appsmith.com/ConnectData.png"
            width="135"
          />
          <StyledImg src="https://assets.appsmith.com/Arrow.png" width="42" />
        </ImgContainer>
        <ImgContainer>
          <StyledImg
            src="https://assets.appsmith.com/QueryData.png"
            width="330"
          />
        </ImgContainer>
        <ImgContainer>
          <StyledImg src="https://assets.appsmith.com/Arrow.png" width="42" />
          <StyledImg
            src="https://assets.appsmith.com/PublishApps.png"
            width="92"
          />
        </ImgContainer>
      </ImgWrapper>
      <ContentWrapper>
        <div>
          <StyledCount>1.</StyledCount>
          <p>Connect your database or API</p>
        </div>
        <div>
          <StyledCount>2.</StyledCount>
          <p>
            Connect queried data to pre-built widgets and customise with
            Javascript.
          </p>
        </div>
        <div>
          <StyledCount>3.</StyledCount>
          <p> Instantly publish and share your apps</p>
        </div>
      </ContentWrapper>
    </Wrapper>
  );
});
