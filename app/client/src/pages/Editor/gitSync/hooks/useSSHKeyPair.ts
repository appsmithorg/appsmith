import { useDispatch, useSelector } from "react-redux";
import {
  getSSHKeyDeployDocUrl,
  getSshKeyPair,
} from "selectors/gitSyncSelectors";
import { useCallback, useState } from "react";
import { generateSSHKeyPair, getSSHKeyPair } from "actions/gitSyncActions";
import noop from "lodash/noop";

export const useSSHKeyPair = () => {
  // As SSHKeyPair fetching and generation is only done only for GitConnection part,
  // All the state are maintained here instead of redux state.

  const dispatch = useDispatch();

  const SSHKeyPair = useSelector(getSshKeyPair);
  const deployKeyDocUrl = useSelector(getSSHKeyDeployDocUrl);

  const [generatingSSHKey, setIsGeneratingSSHKey] = useState(false);

  const [fetchingSSHKeyPair, setIsFetchingSSHKeyPair] = useState(false);

  const [failedGeneratingSSHKey, setFailedGeneratingSSHKey] = useState(false);

  const fetchSSHKeyPair = useCallback(
    ({ onErrorCallback = noop, onSuccessCallback = noop } = {}) => {
      setIsFetchingSSHKeyPair(true);
      dispatch(
        getSSHKeyPair({
          onErrorCallback: (e) => {
            onErrorCallback(e);
            setIsFetchingSSHKeyPair(false);
          },
          onSuccessCallback: (data) => {
            onSuccessCallback(data);
            setIsFetchingSSHKeyPair(false);
          },
        }),
      );
    },
    [setIsFetchingSSHKeyPair],
  );

  const generateSSHKey = useCallback(
    (
      keyType = "ECDSA",
      { onErrorCallback = noop, onSuccessCallback = noop } = {},
    ) => {
      // if (currentApplication?.id) {
      setIsGeneratingSSHKey(true);
      setFailedGeneratingSSHKey(false);

      dispatch(
        generateSSHKeyPair({
          onErrorCallback: (e) => {
            onErrorCallback(e);
            setIsGeneratingSSHKey(false);
            setFailedGeneratingSSHKey(true);
          },
          onSuccessCallback: (data) => {
            onSuccessCallback(data);
            setIsGeneratingSSHKey(false);
          },
          payload: { keyType },
        }),
      );
    },
    [setIsGeneratingSSHKey],
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
