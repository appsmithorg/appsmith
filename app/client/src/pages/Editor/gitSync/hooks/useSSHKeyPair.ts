import { useDispatch, useSelector } from "react-redux";
import {
  getSSHKeyDeployDocUrl,
  getSshKeyPair,
} from "selectors/gitSyncSelectors";
import { useCallback, useEffect, useState } from "react";
import { generateSSHKeyPair, getSSHKeyPair } from "actions/gitSyncActions";

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

  const generateSSHKey = useCallback(
    (keyType = "ECDSA") => {
      // if (currentApplication?.id) {
      setIsGeneratingSSHKey(true);
      setFailedGeneratingSSHKey(false);

      dispatch(
        generateSSHKeyPair({
          onErrorCallback: onGenerateSSHKeyFailure,
          payload: { keyType },
        }),
      );
    },
    [onGenerateSSHKeyFailure, setIsGeneratingSSHKey],
  );

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
