import Button from "components/ads/Button";
import React, { useState } from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  display: inline-flex;
  gap: 2px;
  height: 5px;
  width: 100%;
`;

const ProgressBar = styled.div<{ done: boolean }>`
  flex: 1;
  height: 100%;
  background-color: #e8e8e8;
  background: linear-gradient(to left, #e8e8e8 50%, #f86a2b 50%) right;
  background-size: 200% 100%;
  transition: 0.2s ease-out;

  ${(props) => props.done && `background-position: left`}
`;

const GuideWrapper = styled.div`
  margin-left: 3%;
  margin-right: 3%;
  margin-top: 17px;
`;

const CardWrapper = styled.div`
  width: 100%;
  display: flex;
  border: 1px solid #f0f0f0;
  border-top-width: 0px;
  box-shadow: 0px 0px 16px -4px rgba(16, 24, 40, 0.1),
    0px 0px 6px -2px rgba(16, 24, 40, 0.05);
  flex-direction: column;
`;

const Title = styled.span`
  font-weight: 600;
  font-size: 20px;
  letter-spacing: -0.24px;
  line-height: 20px;
  color: #000000;
`;

const Description = styled.span<{ addLeftSpacing?: boolean }>`
  font-size: 16px;
  line-height: 19px;
  letter-spacing: -0.24px;
  padding-left: ${(props) => (props.addLeftSpacing ? `20px` : "0px")};
  margin-top: 13px;
`;

const UpperContent = styled.div`
  padding: 19px 24px 16px 15px;
  flex-direction: column;
  display: flex;
`;

const ContentWrapper = styled.div`
  display: flex;
  div:first-child {
    flex-direction: column;
    display: flex;
  }
`;

function StatusBar(props: any) {
  return (
    <Wrapper>
      <ProgressBar done={props.currentStep > 1} />
      <ProgressBar done={props.currentStep > 2} />
      <ProgressBar done={props.currentStep > 3} />
      <ProgressBar done={props.currentStep > 4} />
      <ProgressBar done={props.currentStep > 5} />
      <ProgressBar done={props.currentStep > 6} />
      <ProgressBar done={props.currentStep > 7} />
    </Wrapper>
  );
}

function InitialContent() {
  return (
    <ContentWrapper>
      <div>
        <Title>Let’s Build a Customer Support App</Title>
        <Description>
          Below is the customer support app that we will end up building through
          this welcome tour. Check it out and play with it before we start the
          tour.
        </Description>
      </div>
      <Button text="Start Building" />
    </ContentWrapper>
  );
}

function StepsContent() {
  return (
    <>
      <Title>Let’s Build a Customer Support App</Title>
      <Description addLeftSpacing>
        Below is the customer support app that we will end up building through
        this welcome tour. Check it out and play with it before we start the
        tour.
      </Description>
    </>
  );
}

// Guided tour steps
function Guide() {
  const [step, setStep] = useState(0);

  return (
    <GuideWrapper onClick={() => setStep((step) => step + 1)}>
      <CardWrapper>
        <StatusBar currentStep={step} totalSteps={6} />
        <UpperContent>
          <InitialContent />
        </UpperContent>
      </CardWrapper>
    </GuideWrapper>
  );
}

export default Guide;
