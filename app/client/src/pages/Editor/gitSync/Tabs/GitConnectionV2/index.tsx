import React, { useState } from "react";
import { Button, ModalBody, ModalFooter, Text } from "design-system";
import Steps from "./Steps";
import ChooseGitProvider from "./ChooseGitProvider";
import GenerateSSH from "./GenerateSSH";
import AddDeployKey from "./AddDeployKey";
import styled from "styled-components";
import { GIT_CONNECT_STEPS } from "./constants";
import { useGitConnect } from "../../hooks";
import { isValidGitRemoteUrl } from "../../utils";
// import { useDispatch } from "react-redux";
// import { GitSyncModalTab } from "entities/GitSync";
// import { setIsGitSyncModalOpen } from "actions/gitSyncActions";

const StyledModalFooter = styled(ModalFooter)`
  justify-content: space-between;
  flex-direction: row-reverse;
`;

const steps = [
  {
    key: GIT_CONNECT_STEPS.CHOOSE_PROVIDER,
    text: "Choose a git provider",
  },
  {
    key: GIT_CONNECT_STEPS.GENERATE_SSH_KEY,
    text: "Generate SSH key",
  },
  {
    key: GIT_CONNECT_STEPS.ADD_DEPLOY_KEY,
    text: "Add deploy key",
  },
];

const possibleSteps = steps.map((s) => s.key);

const nextStepText = {
  [GIT_CONNECT_STEPS.CHOOSE_PROVIDER]: "Configure git",
  [GIT_CONNECT_STEPS.GENERATE_SSH_KEY]: "Generate SSH key",
  [GIT_CONNECT_STEPS.ADD_DEPLOY_KEY]: "Connect git",
};

interface FormDataState {
  gitProvider?: string;
  gitEmptyRepoExists?: string;
  remoteUrl?: string;
  isAddedDeployKey?: boolean;
  sshKeyType?: "RSA" | "ECDSA";
}

function GitConnectionV2() {
  // const dispatch = useDispatch();

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

  const [activeStep, setActiveStep] = useState<string>(
    GIT_CONNECT_STEPS.CHOOSE_PROVIDER,
  );
  const currentIndex = steps.findIndex((s) => s.key === activeStep);

  const { connectToGit, isConnectingToGit } = useGitConnect();

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
              // {
              //   onSuccessCallback: () => {
              //     dispatch(
              //       setIsGitSyncModalOpen({
              //         isOpen: true,
              //         tab: GitSyncModalTab.CONNECTION_SUCCESS,
              //       }),
              //     );
              //   },
              // },
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
        {possibleSteps.includes(activeStep) && (
          <Steps
            activeKey={activeStep}
            onActiveKeyChange={setActiveStep}
            steps={steps}
          />
        )}
        {activeStep === GIT_CONNECT_STEPS.CHOOSE_PROVIDER && (
          <ChooseGitProvider onChange={handleChange} value={formData} />
        )}
        {activeStep === GIT_CONNECT_STEPS.GENERATE_SSH_KEY && (
          <GenerateSSH onChange={handleChange} value={formData} />
        )}
        {activeStep === GIT_CONNECT_STEPS.ADD_DEPLOY_KEY && (
          <AddDeployKey onChange={handleChange} value={formData} />
        )}
      </ModalBody>
      <StyledModalFooter>
        {isConnectingToGit && <Text>Connecting ...</Text>}
        {!isConnectingToGit && (
          <Button
            endIcon={
              currentIndex < steps.length - 1 ? "arrow-right-s-line" : undefined
            }
            isDisabled={isDisabled[activeStep]}
            onClick={handleNextStep}
            size="md"
          >
            {nextStepText[activeStep]}
          </Button>
        )}
        {possibleSteps.includes(activeStep) && currentIndex > 0 && (
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
