import React, { useState } from "react";
import { Button, ModalBody, ModalFooter } from "design-system";
import Steps from "./Steps";
import ChooseGitProvider from "./ChooseGitProvider";
import GenerateSSH from "./GenerateSSH";
import AddDeployKey from "./AddDeployKey";
import styled from "styled-components";
import { GIT_CONNECT_STEPS } from "./constants";
import { useGitConnect } from "../../hooks";
import { isValidGitRemoteUrl } from "../../utils";
import { importAppFromGit } from "actions/gitSyncActions";
import { useDispatch, useSelector } from "react-redux";
import { getIsImportingApplicationViaGit } from "selectors/gitSyncSelectors";
import {
  CONNECTING_REPO,
  IMPORTING_APP_FROM_GIT,
  createMessage,
} from "@appsmith/constants/messages";
import GitSyncStatusbar from "../../components/Statusbar";

const StyledModalFooter = styled(ModalFooter)`
  justify-content: space-between;
  flex-direction: row-reverse;
`;

const StatusbarWrapper = styled.div`
  > div {
    height: 36px;
  }

  > div > div {
    margin-top: 0px;
  }
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
  gitExistingRepoExists?: boolean;
  remoteUrl?: string;
  isAddedDeployKey?: boolean;
  sshKeyType?: "RSA" | "ECDSA";
}

interface GitConnectionV2Props {
  isImport?: boolean;
}

function GitConnectionV2({ isImport = false }: GitConnectionV2Props) {
  const isImportingViaGit = useSelector(getIsImportingApplicationViaGit);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState<FormDataState>({
    gitProvider: undefined,
    gitEmptyRepoExists: undefined,
    gitExistingRepoExists: false,
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
    [GIT_CONNECT_STEPS.CHOOSE_PROVIDER]: !isImport
      ? !formData.gitProvider ||
        !formData.gitEmptyRepoExists ||
        formData.gitEmptyRepoExists === "no"
      : !formData.gitProvider || !formData.gitExistingRepoExists,
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
          const gitProfile = {
            authorName: "",
            authorEmail: "",
          };
          if (formData.remoteUrl) {
            if (!isImport) {
              connectToGit({
                remoteUrl: formData.remoteUrl,
                gitProfile,
                isDefaultProfile: true,
              });
            } else {
              dispatch(
                importAppFromGit({
                  payload: {
                    remoteUrl: formData.remoteUrl,
                    gitProfile,
                    isDefaultProfile: true,
                  },
                }),
              );
            }
          }
          break;
        }
      }
    }
  };

  const stepProps = {
    onChange: handleChange,
    value: formData,
    isImport: isImport,
  };

  const loading =
    (!isImport && isConnectingToGit) || (isImport && isImportingViaGit);

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
          <ChooseGitProvider {...stepProps} />
        )}
        {activeStep === GIT_CONNECT_STEPS.GENERATE_SSH_KEY && (
          <GenerateSSH {...stepProps} />
        )}
        {activeStep === GIT_CONNECT_STEPS.ADD_DEPLOY_KEY && (
          <AddDeployKey {...stepProps} />
        )}
      </ModalBody>
      <StyledModalFooter>
        {loading && (
          <StatusbarWrapper className="t--connect-statusbar">
            <GitSyncStatusbar
              completed={!loading}
              message={createMessage(
                isImport ? IMPORTING_APP_FROM_GIT : CONNECTING_REPO,
              )}
              period={4}
            />
          </StatusbarWrapper>
        )}
        {!loading && (
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
            isDisabled={loading}
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
