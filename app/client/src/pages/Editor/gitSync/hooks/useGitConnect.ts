import { useDispatch } from "react-redux";
import { useCallback, useState } from "react";
import { ConnectToGitPayload } from "api/GitSyncAPI";
import { connectToGitInit } from "actions/gitSyncActions";

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
