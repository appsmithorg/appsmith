import { useDispatch, useSelector } from "react-redux";
import { useState, useCallback } from "react";
import {
  generateSSHKeyPair,
  fetchApplication,
} from "actions/applicationActions";
import { APP_MODE } from "entities/App";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import { connectToGitInit } from "../../../actions/gitSyncActions";
import { ConnectToGitPayload } from "../../../api/GitSyncAPI";

export const useSSHKeyPair = () => {
  const dispatch = useDispatch();

  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const sshKeyPair = gitMetaData?.gitAuth?.publicKey;

  const [generatingSSHKey, setIsGeneratingSSHKey] = useState<boolean>(false);

  const [failedGeneratingSSHKey, setFailedGeneratingSSHKey] = useState<boolean>(
    false,
  );

  const onGenerateSSHKeySuccess = useCallback(() => {
    setIsGeneratingSSHKey(false);
  }, [setIsGeneratingSSHKey]);

  const onGenerateSSHKeyFailure = useCallback(() => {
    setIsGeneratingSSHKey(false);
    setFailedGeneratingSSHKey(true);
  }, [setIsGeneratingSSHKey]);

  const generateSSHKey = useCallback(
    (applicationId) => {
      if (applicationId) {
        setIsGeneratingSSHKey(true);
        setFailedGeneratingSSHKey(false);

        // Here after the ssh key pair generation, we fetch the application data again and on success of it
        dispatch(
          generateSSHKeyPair({
            payload: { applicationId },
            onErrorCallback: onGenerateSSHKeyFailure,
            onSuccessCallback: () => {
              dispatch(
                fetchApplication({
                  payload: { applicationId, mode: APP_MODE.EDIT },
                  onSuccessCallback: onGenerateSSHKeySuccess,
                  onErrorCallback: onGenerateSSHKeyFailure,
                }),
              );
            },
          }),
        );
      }
    },
    [onGenerateSSHKeySuccess, onGenerateSSHKeyFailure, setIsGeneratingSSHKey],
  );

  return {
    generatingSSHKey,
    failedGeneratingSSHKey,
    generateSSHKey,
    sshKeyPair,
  };
};

export const useGitConnect = ({ onSuccess }: { onSuccess: () => void }) => {
  const dispatch = useDispatch();

  // const gitMetaData = useSelector(getCurrentAppGitMetaData);
  // const sshKeyPair = gitMetaData?.gitAuth?.publicKey;

  const [isConnectingToGit, setIsConnectingToGit] = useState<boolean>(false);

  const [failedConnectingToGit, setFailedConnectingToGit] = useState<boolean>(
    false,
  );

  const onGitConnectSuccess = useCallback(() => {
    setIsConnectingToGit(false);
    onSuccess();
  }, [setIsConnectingToGit]);

  const onGitConnectFailure = useCallback(() => {
    setIsConnectingToGit(false);
    setFailedConnectingToGit(true);
  }, [setIsConnectingToGit]);

  const connectToGit = useCallback(
    (payload: ConnectToGitPayload) => {
      if (payload.applicationId) {
        setIsConnectingToGit(true);
        setFailedConnectingToGit(false);

        // Here after the ssh key pair generation, we fetch the application data again and on success of it
        dispatch(
          connectToGitInit({
            payload,
            onSuccessCallback: onGitConnectSuccess,
            onErrorCallback: onGitConnectFailure,
          }),
        );
      }
    },
    [onGitConnectSuccess, onGitConnectFailure, setIsConnectingToGit],
  );

  return {
    isConnectingToGit,
    failedConnectingToGit,
    connectToGit,
  };
};
