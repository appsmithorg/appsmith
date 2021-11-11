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
  height: 100px;
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

function Guide() {
  const [step, setStep] = useState(0);

  return (
    <GuideWrapper onClick={() => setStep((step) => step + 1)}>
      <StatusBar currentStep={step} totalSteps={6} />
    </GuideWrapper>
  );
}

export default Guide;
