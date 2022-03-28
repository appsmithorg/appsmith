import { useDispatch, useSelector } from "react-redux";
import { useState, useCallback, useEffect } from "react";
import { generateSSHKeyPair, getSSHKeyPair } from "actions/gitSyncActions";
import { connectToGitInit } from "actions/gitSyncActions";
import { ConnectToGitPayload } from "api/GitSyncAPI";
import {
  getSSHKeyDeployDocUrl,
  getSshKeyPair,
} from "selectors/gitSyncSelectors";

export const useSSHKeyPair = () => {
  // As SSHKeyPair fetching and generation is only done only for GitConnection part,
  // All the state are maintained here instead of redux state.

  const dispatch = useDispatch();

  const SSHKeyPair = useSelector(getSshKeyPair);
  const deployKeyDocUrl = useSelector(getSSHKeyDeployDocUrl);

  const [generatingSSHKey, setIsGeneratingSSHKey] = useState(false);

  const [fetchingSSHKeyPair, setIsFetchingSSHKeyPair] = useState(false);

  const [failedGeneratingSSHKey, setFailedGeneratingSSHKey] = useState(false);

  useEffect(() => {
    // on change of sshKeyPair if it is defined, then stop the loading state.
    if (SSHKeyPair) {
      if (generatingSSHKey) setIsGeneratingSSHKey(false);
      if (fetchingSSHKeyPair) setIsFetchingSSHKeyPair(false);
    }
  }, [SSHKeyPair]);

  const fetchSSHKeyPair = useCallback(() => {
    setIsFetchingSSHKeyPair(true);
    dispatch(
      getSSHKeyPair({
        onErrorCallback: () => {
          setIsFetchingSSHKeyPair(false);
        },
      }),
    );
  }, [setIsFetchingSSHKeyPair]);

  const onGenerateSSHKeyFailure = useCallback(() => {
    setIsGeneratingSSHKey(false);
    setFailedGeneratingSSHKey(true);
  }, [setIsGeneratingSSHKey]);

  const generateSSHKey = useCallback(() => {
    // if (currentApplication?.id) {
    setIsGeneratingSSHKey(true);
    setFailedGeneratingSSHKey(false);

    dispatch(
      generateSSHKeyPair({
        onErrorCallback: onGenerateSSHKeyFailure,
      }),
    );
    // }
  }, [onGenerateSSHKeyFailure, setIsGeneratingSSHKey]);

  return {
    generatingSSHKey,
    failedGeneratingSSHKey,
    generateSSHKey,
    SSHKeyPair,
    deployKeyDocUrl,
    fetchSSHKeyPair,
    fetchingSSHKeyPair,
  };
};

export const useGitConnect = () => {
  const dispatch = useDispatch();

  const [isConnectingToGit, setIsConnectingToGit] = useState(false);

  const onGitConnectSuccess = useCallback(() => {
    setIsConnectingToGit(false);
  }, [setIsConnectingToGit]);

  const onGitConnectFailure = useCallback(() => {
    setIsConnectingToGit(false);
  }, [setIsConnectingToGit]);

  const connectToGit = useCallback(
    (payload: ConnectToGitPayload) => {
      setIsConnectingToGit(true);
      // Here after the ssh key pair generation, we fetch the application data again and on success of it
      dispatch(
        connectToGitInit({
          payload,
          onSuccessCallback: onGitConnectSuccess,
          onErrorCallback: onGitConnectFailure,
        }),
      );
    },
    [onGitConnectSuccess, onGitConnectFailure, setIsConnectingToGit],
  );

  return {
    isConnectingToGit,
    connectToGit,
  };
};
