import React, { useState } from "react";
import { Button, ModalBody, ModalFooter } from "@appsmith/ads";
import Steps from "./Steps";
import type { GitProvider } from "./ChooseGitProvider";
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
  ADD_DEPLOY_KEY_STEP,
  CHOOSE_A_GIT_PROVIDER_STEP,
  CONFIGURE_GIT,
  CONNECT_GIT_TEXT,
  GENERATE_SSH_KEY_STEP,
  GIT_CONNECT_WAITING,
  GIT_IMPORT_WAITING,
  IMPORT_APP_CTA,
  PREVIOUS_STEP,
  createMessage,
} from "ee/constants/messages";
import GitSyncStatusbar from "../../components/Statusbar";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const StyledModalBody = styled(ModalBody)`
  flex: 1;
  overflow-y: initial;
  display: flex;
  flex-direction: column;
  min-height: min-content;
  max-height: calc(
    100vh - 200px - 32px - 56px - 44px
  ); // 200px offset, 32px outer padding, 56px footer, 44px header
`;

interface StyledModalFooterProps {
  loading?: boolean;
}

const StyledModalFooter = styled(ModalFooter)<StyledModalFooterProps>`
  justify-content: space-between;
  flex-direction: ${(p) => (!p.loading ? "row-reverse" : "row")};
`;

const StatusbarWrapper = styled.div`
  margin-top: 16px;

  > div {
    display: flex;
    height: initial;
    align-items: center;
  }

  > div > div {
    margin-top: 0px;
    width: 200px;
    margin-right: 12px;
  }

  > div > p {
    margin-top: 0;
  }
`;

const steps = [
  {
    key: GIT_CONNECT_STEPS.CHOOSE_PROVIDER,
    text: createMessage(CHOOSE_A_GIT_PROVIDER_STEP),
  },
  {
    key: GIT_CONNECT_STEPS.GENERATE_SSH_KEY,
    text: createMessage(GENERATE_SSH_KEY_STEP),
  },
  {
    key: GIT_CONNECT_STEPS.ADD_DEPLOY_KEY,
    text: createMessage(ADD_DEPLOY_KEY_STEP),
  },
];

const possibleSteps = steps.map((s) => s.key);

interface FormDataState {
  gitProvider?: GitProvider;
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [errorData, setErrorData] = useState<any>();
  const isImportingViaGit = useSelector(getIsImportingApplicationViaGit);
  const dispatch = useDispatch();

  const nextStepText = {
    [GIT_CONNECT_STEPS.CHOOSE_PROVIDER]: createMessage(CONFIGURE_GIT),
    [GIT_CONNECT_STEPS.GENERATE_SSH_KEY]: createMessage(GENERATE_SSH_KEY_STEP),
    [GIT_CONNECT_STEPS.ADD_DEPLOY_KEY]: createMessage(
      isImport ? IMPORT_APP_CTA : CONNECT_GIT_TEXT,
    ),
  };

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
          AnalyticsUtil.logEvent("GS_CONFIGURE_GIT");
          break;
        }
        case GIT_CONNECT_STEPS.GENERATE_SSH_KEY: {
          setActiveStep(GIT_CONNECT_STEPS.ADD_DEPLOY_KEY);
          AnalyticsUtil.logEvent("GS_GENERATE_KEY_BUTTON_CLICK", {
            repoUrl: formData?.remoteUrl,
            connectFlow: "v2",
          });
          break;
        }
        case GIT_CONNECT_STEPS.ADD_DEPLOY_KEY: {
          const gitProfile = {
            authorName: "",
            authorEmail: "",
            useGlobalProfile: true,
          };
          if (formData.remoteUrl) {
            if (!isImport) {
              connectToGit(
                {
                  remoteUrl: formData.remoteUrl,
                  gitProfile,
                },
                {
                  // TODO: Fix this the next time the file is edited
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onErrorCallback: (error: any, response?: any) => {
                    // AE-GIT-4033 is repo not empty error
                    if (response?.responseMeta?.error?.code === "AE-GIT-4033") {
                      setActiveStep(GIT_CONNECT_STEPS.GENERATE_SSH_KEY);
                    }
                    const errorResponse = response || error?.response?.data;
                    setErrorData(errorResponse);
                  },
                },
              );
              AnalyticsUtil.logEvent(
                "GS_CONNECT_BUTTON_ON_GIT_SYNC_MODAL_CLICK",
                { repoUrl: formData?.remoteUrl, connectFlow: "v2" },
              );
            } else {
              dispatch(
                importAppFromGit({
                  payload: {
                    remoteUrl: formData.remoteUrl,
                    gitProfile,
                    // isDefaultProfile: true,
                  },
                  onErrorCallback(error, response) {
                    const errorResponse = response || error?.response?.data;
                    setErrorData(errorResponse);
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
    isImport,
    errorData,
  };

  const loading =
    (!isImport && isConnectingToGit) || (isImport && isImportingViaGit);

  return (
    <>
      <StyledModalBody>
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
          <AddDeployKey {...stepProps} connectLoading={loading} />
        )}
      </StyledModalBody>
      <StyledModalFooter loading={loading}>
        {loading && (
          <StatusbarWrapper className="t--connect-statusbar">
            <GitSyncStatusbar
              completed={!loading}
              message={createMessage(
                isImport ? GIT_IMPORT_WAITING : GIT_CONNECT_WAITING,
              )}
              period={4}
            />
          </StatusbarWrapper>
        )}
        {!loading && (
          <Button
            data-testid="t--git-connect-next-button"
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
        {possibleSteps.includes(activeStep) && currentIndex > 0 && !loading && (
          <Button
            isDisabled={loading}
            kind="secondary"
            onClick={handlePreviousStep}
            size="md"
            startIcon="arrow-left-s-line"
          >
            {createMessage(PREVIOUS_STEP)}
          </Button>
        )}
      </StyledModalFooter>
    </>
  );
}

export default GitConnectionV2;
