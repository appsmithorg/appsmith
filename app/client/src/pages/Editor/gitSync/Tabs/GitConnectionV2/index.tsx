import React, { useState } from "react";
import { Button, ModalBody, ModalFooter } from "design-system";
import Steps from "./Steps";
import ChooseGitProvider from "./ChooseGitProvider";
import GenerateSSH from "./GenerateSSH";
import AddDeployKey from "./AddDeployKey";
import styled from "styled-components";
import { GIT_CONNECT_STEPS } from "./constants";

const StyledModalFooter = styled(ModalFooter)`
  justify-content: space-between;
  flex-direction: row-reverse;
`;

const steps = [
  {
    key: GIT_CONNECT_STEPS.CHOOSE_PROVIDER,
    text: "Choose a git provider",
    nextStep: "Configure git",
  },
  {
    key: GIT_CONNECT_STEPS.GENERATE_SSH_KEY,
    text: "Generate SSH key",
    nextStep: "Generate SSH key",
  },
  {
    key: GIT_CONNECT_STEPS.ADD_DEPLOY_KEY,
    text: "Add deploy key",
    nextStep: "Connect Git",
  },
];

const StepComp = {
  [GIT_CONNECT_STEPS.CHOOSE_PROVIDER]: ChooseGitProvider,
  [GIT_CONNECT_STEPS.GENERATE_SSH_KEY]: GenerateSSH,
  [GIT_CONNECT_STEPS.ADD_DEPLOY_KEY]: AddDeployKey,
};

function GitConnectionV2() {
  const [activeStep, setActiveStep] = useState<string>(
    GIT_CONNECT_STEPS.CHOOSE_PROVIDER,
  );
  const currentIndex = steps.findIndex((s) => s.key === activeStep);

  const [isValid, setIsValid] = useState({
    [GIT_CONNECT_STEPS.CHOOSE_PROVIDER]: false,
    [GIT_CONNECT_STEPS.GENERATE_SSH_KEY]: false,
    [GIT_CONNECT_STEPS.ADD_DEPLOY_KEY]: false,
  });

  const handleStepValidation = (step: string, isValid: boolean) => {
    setIsValid((prev) => ({
      ...prev,
      [step]: isValid,
    }));
  };

  const handlePreviousStep = () => {
    if (currentIndex > 0) {
      setActiveStep(steps[currentIndex - 1].key);
    }
  };

  const handleNextStep = () => {
    if (currentIndex < steps.length - 1) {
      setActiveStep(steps[currentIndex + 1].key);
    }
  };

  return (
    <>
      <ModalBody>
        <Steps
          activeKey={activeStep}
          onActiveKeyChange={setActiveStep}
          steps={steps}
        />
        {steps.map((step) => {
          const Comp = StepComp[step.key];
          return (
            <Comp
              key={step.key}
              onValidate={(v) => handleStepValidation(activeStep, v)}
              show={step.key === activeStep}
            />
          );
        })}
      </ModalBody>
      <StyledModalFooter>
        <Button
          endIcon={
            currentIndex < steps.length - 1 ? "arrow-right-s-line" : undefined
          }
          isDisabled={!isValid[activeStep]}
          onClick={handleNextStep}
          size="md"
        >
          {steps[currentIndex].nextStep}
        </Button>
        {currentIndex > 0 && (
          <Button
            kind="secondary"
            onClick={handlePreviousStep}
            size="md"
            startIcon="arrow-left-s-line"
          >
            Previous Step
          </Button>
        )}
      </StyledModalFooter>
    </>
  );
}

export default GitConnectionV2;
