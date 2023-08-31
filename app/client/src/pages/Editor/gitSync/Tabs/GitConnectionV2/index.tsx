import React, { useEffect, useState } from "react";
import { Button, ModalBody, ModalFooter, Text, toast } from "design-system";
import Steps from "./Steps";
import ChooseGitProvider from "./ChooseGitProvider";
import GenerateSSH from "./GenerateSSH";
import AddDeployKey from "./AddDeployKey";
import styled from "styled-components";
import { GIT_CONNECT_STEPS } from "./constants";
import { useGitConnect, useSSHKeyPair } from "../../hooks";
import { isValidGitRemoteUrl } from "../../utils";

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

interface FormDataState {
  gitProvider?: string;
  gitEmptyRepoExists?: string;
  remoteUrl?: string;
  isAddedDeployKey?: boolean;
  sshKeyType?: "RSA" | "ECDSA";
}

function GitConnectionV2() {
  const [formData, setFormData] = useState<FormDataState>({
    gitProvider: undefined,
    gitEmptyRepoExists: undefined,
    remoteUrl: undefined,
    isAddedDeployKey: false,
    sshKeyType: "ECDSA",
  });

  const handleChange = (partialFormData: Partial<FormDataState>) => {
    setFormData((s) => ({ ...s, ...partialFormData }));
  };

  // const [gitProvider, setGitProvider] = useState<string>();
  // const [gitEmptyRepoExists, setGitEmptyRepoExists] = useState<string>();

  const [activeStep, setActiveStep] = useState<string>(
    GIT_CONNECT_STEPS.CHOOSE_PROVIDER,
  );
  const currentIndex = steps.findIndex((s) => s.key === activeStep);

  const [connectedToGit, setConnectedToGit] = useState(false);
  const { connectToGit, isConnectingToGit } = useGitConnect();

  // const [isValid, setIsValid] = useState({
  //   [GIT_CONNECT_STEPS.CHOOSE_PROVIDER]: false,
  //   [GIT_CONNECT_STEPS.GENERATE_SSH_KEY]: false,
  //   [GIT_CONNECT_STEPS.ADD_DEPLOY_KEY]: false,
  // });

  // const handleStepValidation = (step: string, isValid: boolean) => {
  //   setIsValid((prev) => ({
  //     ...prev,
  //     [step]: isValid,
  //   }));
  // };

  const isDisabled = {
    [GIT_CONNECT_STEPS.CHOOSE_PROVIDER]:
      !formData.gitProvider ||
      !formData.gitEmptyRepoExists ||
      formData.gitEmptyRepoExists === "no",
    [GIT_CONNECT_STEPS.GENERATE_SSH_KEY]:
      typeof formData?.remoteUrl !== "string" ||
      !isValidGitRemoteUrl(formData?.remoteUrl),
    [GIT_CONNECT_STEPS.ADD_DEPLOY_KEY]: !formData.isAddedDeployKey,
  };

  const handlePreviousStep = () => {
    if (currentIndex > 0) {
      setActiveStep(steps[currentIndex - 1].key);
    }
  };

  const handleNextStep = () => {
    console.log({ currentIndex, s: steps.length });
    if (currentIndex < steps.length) {
      switch (activeStep) {
        case GIT_CONNECT_STEPS.CHOOSE_PROVIDER: {
          setActiveStep(GIT_CONNECT_STEPS.GENERATE_SSH_KEY);
          break;
        }
        case GIT_CONNECT_STEPS.GENERATE_SSH_KEY: {
          setActiveStep(GIT_CONNECT_STEPS.ADD_DEPLOY_KEY);
          break;
        }
        case GIT_CONNECT_STEPS.ADD_DEPLOY_KEY: {
          console.log("HERE");
          if (formData.remoteUrl) {
            connectToGit(
              {
                remoteUrl: formData.remoteUrl,
                gitProfile: {
                  authorName: "Appsmith",
                  authorEmail: "abc@xyz.com",
                },
                isDefaultProfile: true,
              },
              {
                onSuccessCallback: () => {
                  setConnectedToGit(true);
                  console.log("HANDLE REDIRECTION HERE");
                },
              },
            );
          }
          break;
        }
      }
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
        {activeStep === GIT_CONNECT_STEPS.CHOOSE_PROVIDER && (
          <ChooseGitProvider onChange={handleChange} value={formData} />
        )}
        {activeStep === GIT_CONNECT_STEPS.GENERATE_SSH_KEY && (
          <GenerateSSH onChange={handleChange} value={formData} />
        )}
        {activeStep === GIT_CONNECT_STEPS.ADD_DEPLOY_KEY && (
          <AddDeployKey onChange={handleChange} value={formData} />
        )}
        {/* {steps.map((step) => {
          const Comp = StepComp[step.key];
          return (
            <Comp
              key={step.key}
              onValidate={(v) => handleStepValidation(activeStep, v)}
              show={step.key === activeStep}
            />
          );
        })} */}
      </ModalBody>
      <StyledModalFooter>
        {isConnectingToGit && <Text>Connecting ...</Text>}
        {!connectedToGit && (
          <Button
            endIcon={
              currentIndex < steps.length - 1 ? "arrow-right-s-line" : undefined
            }
            isDisabled={isDisabled[activeStep]}
            onClick={handleNextStep}
            size="md"
          >
            {steps[currentIndex].nextStep}
          </Button>
        )}
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
