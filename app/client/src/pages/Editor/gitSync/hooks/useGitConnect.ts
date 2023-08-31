import { useDispatch } from "react-redux";
import { useCallback, useState } from "react";
import type { ConnectToGitPayload } from "api/GitSyncAPI";
import { connectToGitInit } from "actions/gitSyncActions";

const NOOP = () => {
  // do nothing
};

export const useGitConnect = () => {
  const dispatch = useDispatch();

  const [isConnectingToGit, setIsConnectingToGit] = useState(false);

  const connectToGit = useCallback(
    (
      payload: ConnectToGitPayload,
      { onErrorCallback = NOOP, onSuccessCallback = NOOP } = {},
    ) => {
      setIsConnectingToGit(true);
      // Here after the ssh key pair generation, we fetch the application data again and on success of it
      dispatch(
        connectToGitInit({
          payload,
          onSuccessCallback: (data) => {
            onSuccessCallback(data);
            setIsConnectingToGit(false);
          },
          onErrorCallback: (e) => {
            onErrorCallback(e);
            setIsConnectingToGit(false);
          },
        }),
      );
    },
    [setIsConnectingToGit],
  );

  return {
    isConnectingToGit,
    connectToGit,
  };
};
