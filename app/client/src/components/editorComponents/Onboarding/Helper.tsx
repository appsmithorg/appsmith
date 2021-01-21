import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { getOnboardingWelcomeState } from "utils/storage";

const StyledContainer = styled.div`
  position: fixed;
  bottom: 37px;
  left: 37px;
  z-index: 8;
  color: white;
  padding: 12px;
  background-color: ${(props) => props.theme.colors.homepageBackground};
  border: 2px solid #df613c;
  width: 303px;
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 131px;
  background-color: grey;
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-top: 12px;
`;

const Description = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-top: 12px;
`;

const Button = styled.button`
  padding: 6px 16px;
  cursor: pointer;
  border: none;
`;

const SkipButton = styled(Button)`
  background-color: transparent;
  color: white;
`;

const LetsGo = styled(Button)`
  background-color: #df613c;
  color: white;
`;

const Helper = () => {
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    const showWelcomeHelper = async () => {
      const inOnboarding = await getOnboardingWelcomeState();
      if (inOnboarding) {
        setShowHelper(true);
      }
    };

    showWelcomeHelper();
  }, []);

  if (!showHelper) return null;

  return (
    <StyledContainer>
      <ImagePlaceholder />
      <Title>Welcome, Aakash!</Title>
      <Description>
        Let’s get you started with Appsmith. We’d like to show you around by
        building an app that talks to a database. It’ll only take a minute or
        two.
      </Description>
      <div
        style={{
          marginTop: 9,
          justifyContent: "flex-end",
          display: "flex",
          flex: 1,
        }}
      >
        <SkipButton>No thanks</SkipButton>
        <LetsGo>Let’s go</LetsGo>
      </div>
    </StyledContainer>
  );
};

export default Helper;
